const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../init');

const router = express.Router();

// Get user notifications
router.get('/', authenticate, (req, res) => {
  const user_id = req.user.id;
  
  db.getDb().all(
    `SELECT n.*, e.title AS event_title
     FROM notifications n
     LEFT JOIN events e ON n.event_id = e.id
     WHERE n.user_id = ? 
     ORDER BY n.created_at DESC 
     LIMIT 50`,
    [user_id],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(notifications);
    }
  );
});

// Mark notification as read
router.put('/:id/read', authenticate, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  
  db.getDb().run(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?',
    [id, user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Notification marked as read' });
    }
  );
});

module.exports = router;

