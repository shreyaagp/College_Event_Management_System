const express = require('express');
const QRCode = require('qrcode');
const { authenticate } = require('../middleware/auth');
const db = require('../init');

const router = express.Router();

// Generate QR code for registration
router.get('/:registration_id', authenticate, (req, res) => {
  const { registration_id } = req.params;
  const user_id = req.user.id;
  
  db.getDb().get(
    'SELECT * FROM registrations WHERE id = ? AND user_id = ?',
    [registration_id, user_id],
    (err, registration) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
      }
      
      // QR code should contain the qr_code string for easy scanning
      // The scanner will use this to look up the registration
      const qrData = registration.qr_code;
      
      QRCode.toDataURL(qrData, { errorCorrectionLevel: 'H' }, (err, qrCodeUrl) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to generate QR code' });
        }
        res.json({ qr_code_url: qrCodeUrl, qr_code: registration.qr_code });
      });
    }
  );
});

module.exports = router;

