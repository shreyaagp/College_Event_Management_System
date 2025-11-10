// server/routes/organiser.js
const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Restrict to organiser role
const organiserOnly = (req, res, next) => {
  if (req.user.role !== 'organiser') {
    return res.status(403).json({ error: 'Access denied: Organisers only' });
  }
  next();
};

// 📸 Multer setup for event image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // ensure folder exists
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
const nodemailer = require('nodemailer');

// -------------------- CREATE EVENT --------------------
router.post(
  '/create-event',
  authMiddleware,
  organiserOnly,
  upload.single('image'),
  (req, res) => {
    const { title, description, department, date, time, location, max_participants } = req.body;

    if (!title || !department || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const createdBy = req.user.id;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    db.getDb().run(
      `INSERT INTO events 
        (title, description, department, date, time, location, max_participants, created_by, image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || '', department, date, time, location || '', max_participants || null, createdBy, imagePath],
      function (err) {
        if (err) {
          console.error('❌ Error creating event:', err.message);
          return res.status(500).json({ error: 'Database error while creating event' });
        }
        const newEventId = this.lastID;

        // Broadcast notification to all students about the new event
        const message = `New event created: ${title} on ${date} at ${time}`;
        db.getDb().run(
          `INSERT INTO notifications (user_id, event_id, message, type)
           SELECT id, ?, ?, 'new_event' FROM users WHERE role = 'student'`,
          [newEventId, message],
          async (notifErr) => {
            if (notifErr) {
              console.error('⚠️ Failed to create notifications:', notifErr.message);
            }

            // Send email to all students (non-blocking semantics)
            try {
              const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: process.env.EMAIL_USER,
                  pass: process.env.EMAIL_PASS,
                },
              });

              db.getDb().all(`SELECT email, name FROM users WHERE role = 'student'`, [], async (e2, students) => {
                if (e2) {
                  console.error('⚠️ Failed to fetch student emails:', e2.message);
                } else {
                  const emailPromises = (students || []).map((s) =>
                    transporter.sendMail({
                      from: `"College Events" <${process.env.EMAIL_USER}>`,
                      to: s.email,
                      subject: `New Event: ${title}`,
                      html: `
                        <div style="font-family:sans-serif;line-height:1.6">
                          <h2 style="margin:0 0 8px">New Event: ${title}</h2>
                          <p>Hi ${s.name || 'Student'},</p>
                          <p>You're invited to a new event:</p>
                          <ul>
                            <li><strong>Department</strong>: ${department}</li>
                            <li><strong>Date</strong>: ${date}</li>
                            <li><strong>Time</strong>: ${time}</li>
                            ${location ? `<li><strong>Location</strong>: ${location}</li>` : ''}
                          </ul>
                          ${description ? `<p>${description}</p>` : ''}
                          <p style="margin-top:12px">Open the app to view and register.</p>
                        </div>
                      `,
                    }).catch((err) => {
                      // Log individual email failures but continue
                      console.error(`Email send failed to ${s.email}:`, err?.message || err);
                    })
                  );
                  // Fire and forget; don't await to avoid delaying response too long
                  Promise.allSettled(emailPromises).then(() => {
                    // Done
                  });
                }
              });
            } catch (mailErr) {
              console.error('⚠️ Email notification setup failed:', mailErr?.message || mailErr);
            }

        res.status(201).json({
          message: 'Event created successfully',
              eventId: newEventId,
          image: imagePath,
        });
          }
        );
      }
    );
  }
);

// -------------------- UPDATE EVENT --------------------
router.put('/update-event/:id', authMiddleware, organiserOnly, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, description, department, date, time, location, max_participants, status } = req.body;

  // Dynamic query
  const fields = [];
  const values = [];

  if (title) fields.push('title = ?'), values.push(title);
  if (description) fields.push('description = ?'), values.push(description);
  if (department) fields.push('department = ?'), values.push(department);
  if (date) fields.push('date = ?'), values.push(date);
  if (time) fields.push('time = ?'), values.push(time);
  if (location) fields.push('location = ?'), values.push(location);
  if (max_participants) fields.push('max_participants = ?'), values.push(max_participants);
  if (status) fields.push('status = ?'), values.push(status);
  if (req.file) fields.push('image = ?'), values.push(`/uploads/${req.file.filename}`);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields provided for update' });
  }

  values.push(id, req.user.id); // WHERE clause

  const query = `UPDATE events SET ${fields.join(', ')} WHERE id = ? AND created_by = ?`;

  db.getDb().run(query, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Event not found or unauthorized' });
    res.json({ message: 'Event updated successfully' });
  });
});

// -------------------- MANAGE EVENTS --------------------
router.get('/manage-events', authMiddleware, organiserOnly, (req, res) => {
  const organiserId = req.user.id;
  db.getDb().all(
    `SELECT e.*, 
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered_count
     FROM events e
     WHERE e.created_by = ?
     ORDER BY e.date ASC`,
    [organiserId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// -------------------- DELETE EVENT --------------------
router.delete('/delete-event/:id', authMiddleware, organiserOnly, (req, res) => {
  const { id } = req.params;
  const organiserId = req.user.id;

  console.log("🗑️ Delete attempt for event:", id);
  console.log("👤 Authenticated user:", req.user);

  const dbConn = db.getDb();

  // Step 1: Delete related registrations
  dbConn.run(`DELETE FROM registrations WHERE event_id = ?`, [id], function (err) {
    if (err) {
      console.error("❌ Error deleting registrations:", err.message);
      return res.status(500).json({ error: "Failed to delete registrations" });
    }

    // Step 2: Delete related feedback
    dbConn.run(`DELETE FROM feedback WHERE event_id = ?`, [id], function (err) {
      if (err) {
        console.error("❌ Error deleting feedback:", err.message);
        return res.status(500).json({ error: "Failed to delete feedback" });
      }

      // Step 3: Delete related notifications
      dbConn.run(`DELETE FROM notifications WHERE event_id = ?`, [id], function (err) {
        if (err) {
          console.error("❌ Error deleting notifications:", err.message);
          return res.status(500).json({ error: "Failed to delete notifications" });
        }

        // Step 4: Finally delete the event itself
        dbConn.run(
          `DELETE FROM events WHERE id = ? AND created_by = ?`,
          [id, organiserId],
          function (err) {
            if (err) {
              console.error("❌ Error deleting event:", err.message);
              return res.status(500).json({ error: "Failed to delete event" });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: "Event not found or unauthorized" });
            }

            console.log("✅ Event and all linked records deleted successfully");
            res.json({ message: "Event deleted successfully" });
          }
        );
      });
    });
  });
});
// -------------------- GET PARTICIPANTS --------------------
router.get('/event/:id/participants', authMiddleware, organiserOnly, (req, res) => {
  const { id } = req.params;
  const organiserId = req.user.id;

  db.getDb().get('SELECT * FROM events WHERE id = ? AND created_by = ?', [id, organiserId], (err, event) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });

    db.getDb().all(
      `SELECT r.*, u.name, u.email, u.usn, u.department, u.semester
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = ?
       ORDER BY r.registration_date DESC`,
      [id],
      (err, participants) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ event: { title: event.title, date: event.date }, participants });
      }
    );
  });
});

// -------------------- MARK ATTENDANCE --------------------
router.post('/event/:eventId/mark-attendance/:registrationId', authMiddleware, organiserOnly, (req, res) => {
  const { eventId, registrationId } = req.params;
  const organiserId = req.user.id;

  // Verify organizer owns the event
  db.getDb().get('SELECT * FROM events WHERE id = ? AND created_by = ?', [eventId, organiserId], (err, event) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized' });

    // Check if registration exists and belongs to this event
    db.getDb().get(
      'SELECT * FROM registrations WHERE id = ? AND event_id = ?',
      [registrationId, eventId],
      (err, registration) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!registration) return res.status(404).json({ error: 'Registration not found' });

        if (registration.checked_in) {
          return res.status(400).json({ error: 'Student already marked as attended' });
        }

        // Mark as attended
        db.getDb().run(
          'UPDATE registrations SET checked_in = 1 WHERE id = ?',
          [registrationId],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });

            // Get updated registration with user details
            db.getDb().get(
              `SELECT r.*, u.name, u.email, u.usn, u.semester
               FROM registrations r
               JOIN users u ON r.user_id = u.id
               WHERE r.id = ?`,
              [registrationId],
              (err, updated) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                  message: 'Attendance marked successfully',
                  participant: updated
                });
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
