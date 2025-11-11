const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../init');

const router = express.Router();

// Scan QR code and mark attendance
router.post('/', authenticate, (req, res) => {
  const { qr_code, event_id } = req.body;
  const organiser_id = req.user.id;

  if (!qr_code) {
    return res.status(400).json({ error: 'Missing QR code data' });
  }

  const connection = db.getDb();

  // Find registration by QR code
  connection.get(
    `SELECT r.*, e.created_by, e.title as event_title
     FROM registrations r
     JOIN events e ON r.event_id = e.id
     WHERE r.qr_code = ?`,
    [qr_code],
    (err, registration) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!registration)
        return res.status(404).json({ error: 'Invalid QR code - registration not found' });

      // Ensure organiser owns this event
      if (registration.created_by !== organiser_id) {
        return res.status(403).json({ error: 'Not authorized for this event' });
      }

      // Check event_id match if provided
      if (event_id && registration.event_id !== parseInt(event_id)) {
        return res.status(400).json({ error: 'QR code does not match this event' });
      }

      // Prevent double check-in
      if (registration.checked_in) {
        return res.status(400).json({ error: 'Already checked in' });
      }

      // ✅ Mark attendance
      connection.run(
        `UPDATE registrations SET checked_in = 1 WHERE id = ?`,
        [registration.id],
        function (updateErr) {
          if (updateErr)
            return res.status(500).json({ error: updateErr.message });

          // Return updated participant info
          connection.get(
            `SELECT r.*, u.name, u.email, u.usn, u.semester, e.title as event_title
             FROM registrations r
             JOIN users u ON r.user_id = u.id
             JOIN events e ON r.event_id = e.id
             WHERE r.id = ?`,
            [registration.id],
            (err, updated) => {
              if (err)
                return res.status(500).json({ error: err.message });

              res.json({
                message: 'Attendance marked successfully ✅',
                participant: updated,
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
