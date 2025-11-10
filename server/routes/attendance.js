const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../init');

const router = express.Router();

// Mark attendance by QR code
router.post('/mark-attendance', authenticate, (req, res) => {
  const { qr_code } = req.body;

  if (!qr_code) return res.status(400).json({ error: 'QR code required' });

  db.getDb().run(
    'UPDATE registrations SET status = "Attended" WHERE qr_code = ?',
    [qr_code],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'QR not found or already attended' });
      res.json({ message: 'Attendance marked successfully!' });
    }
  );
});

module.exports = router;
