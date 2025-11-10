// server/routes/registrations.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const db = require('../init');

const router = express.Router();

// Register for event (students only)
router.post('/', authenticate, (req, res) => {
  const { event_id } = req.body;
  const user_id = req.user.id;
  const connection = db.getDb();

  //  Check if event is active
  connection.get(
    'SELECT * FROM events WHERE id = ? AND status = "active"',
    [event_id],
    (err, event) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!event) return res.status(404).json({ error: 'Event not found or not active' });

      //  Check if already registered
      connection.get(
        'SELECT * FROM registrations WHERE event_id = ? AND user_id = ?',
        [event_id, user_id],
        (err, existing) => {
          if (err) return res.status(500).json({ error: err.message });
          if (existing) return res.status(400).json({ error: 'Already registered for this event' });

          //   Check if event is full
          connection.get(
            'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
            [event_id],
            (err, result) => {
              if (err) return res.status(500).json({ error: err.message });
              if (event.max_participants && result.count >= event.max_participants)
                return res.status(400).json({ error: 'Event is full' });

              // Fetch user details and ensure role is student
          connection.get(
                'SELECT role, usn, semester, name FROM users WHERE id = ?',
                [user_id],
                (err, user) => {
                  if (err) return res.status(500).json({ error: err.message });
                  if (!user) return res.status(404).json({ error: 'User not found' });
                  if (user.role !== 'student')
                    return res.status(403).json({ error: 'Only students can register for events' });

                  const qrCode = uuidv4();
                  const registrationDate = new Date().toISOString();

                  //   Insert registration
                  connection.run(
                    `INSERT INTO registrations (event_id, user_id, qr_code, usn, semester, registration_date)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [event_id, user_id, qrCode, user.usn, user.semester, registrationDate],
                    function (err) {
                      if (err) return res.status(500).json({ error: err.message });

                      //   Create notification
                      connection.run(
                        `INSERT INTO notifications (user_id, event_id, message, type)
                         VALUES (?, ?, ?, ?)`,
                        [user_id, event_id, `You have successfully registered for ${event.title}`, 'registration']
                      );

                      // Notify organiser about the new registration
                      connection.run(
                        `INSERT INTO notifications (user_id, event_id, message, type)
                         VALUES (?, ?, ?, ?)`,
                        [
                          event.created_by,
                          event_id,
                          `${user.name || 'A student'} has registered for ${event.title}`,
                          'registration_student'
                        ],
                        (notifyErr) => {
                          if (notifyErr) {
                            console.error('Failed to notify organiser:', notifyErr.message);
                          }
                        }
                      );

                      res.status(201).json({
                        message: 'Registration successful',
                        registration_id: this.lastID,
                        qr_code: qrCode,
                        usn: user.usn,
                        semester: user.semester,
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get user's registrations
router.get('/my-registrations', authenticate, (req, res) => {
  const user_id = req.user.id;
  db.getDb().all(
    `SELECT r.*, e.title, e.description, e.department, e.date, e.time, e.location, e.status as event_status
     FROM registrations r
     JOIN events e ON r.event_id = e.id
     WHERE r.user_id = ?
     ORDER BY e.date, e.time`,
    [user_id],
    (err, registrations) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(registrations);
    }
  );
});

//  Check-in using QR code
router.post('/checkin', authenticate, (req, res) => {
  const { qr_code } = req.body;
  const connection = db.getDb();

  connection.get('SELECT * FROM registrations WHERE qr_code = ?', [qr_code], (err, registration) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!registration) return res.status(404).json({ error: 'Invalid QR code' });
    if (registration.checked_in) return res.status(400).json({ error: 'Already checked in' });

    connection.run('UPDATE registrations SET checked_in = 1 WHERE id = ?', [registration.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      connection.get(
        `SELECT r.*, u.name, u.email, u.usn, u.semester
         FROM registrations r
         JOIN users u ON r.user_id = u.id
         WHERE r.id = ?`,
        [registration.id],
        (err, updated) => {
          if (err) return res.status(500).json({ error: err.message });

          connection.get('SELECT title FROM events WHERE id = ?', [registration.event_id], (err, event) => {
            if (err) return res.status(500).json({ error: err.message });

            res.json({
              message: 'Check-in successful',
              event_title: event.title,
              participant: updated,
            });
          });
        }
      );
    });
  });
});

// Cancel registration
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  db.getDb().run('DELETE FROM registrations WHERE id = ? AND user_id = ?', [id, user_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Registration not found' });
    res.json({ message: 'Registration cancelled successfully' });
  });
});

module.exports = router;
