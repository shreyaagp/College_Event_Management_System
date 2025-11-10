const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../init');

const router = express.Router();

// Submit feedback
router.post('/', authenticate, (req, res) => {
  const { event_id, rating, comment } = req.body;
  const user_id = req.user.id;
  
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  
  // Check if user attended the event (was checked in)
  db.getDb().get(
    'SELECT * FROM registrations WHERE event_id = ? AND user_id = ? AND checked_in = 1',
    [event_id, user_id],
    (err, registration) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!registration) {
        return res.status(400).json({ error: 'You must attend the event to provide feedback' });
      }
      
      // Check if feedback already exists
      db.getDb().get(
        'SELECT * FROM feedback WHERE event_id = ? AND user_id = ?',
        [event_id, user_id],
        (err, existing) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          if (existing) {
            // Update existing feedback
            db.getDb().run(
              'UPDATE feedback SET rating = ?, comment = ? WHERE id = ?',
              [rating, comment, existing.id],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Feedback updated successfully' });
              }
            );
          } else {
            // Create new feedback
            db.getDb().run(
              'INSERT INTO feedback (event_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
              [event_id, user_id, rating, comment],
              function(err) {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.status(201).json({ message: 'Feedback submitted successfully' });
              }
            );
          }
        }
      );
    }
  );
});

// Get feedback for an event
router.get('/event/:event_id', (req, res) => {
  const { event_id } = req.params;
  
  db.getDb().all(
    `SELECT f.*, u.name as user_name
     FROM feedback f
     JOIN users u ON f.user_id = u.id
     WHERE f.event_id = ?
     ORDER BY f.created_at DESC`,
    [event_id],
    (err, feedback) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Calculate average rating
      const avgRating = feedback.length > 0
        ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        : 0;
      
      res.json({
        feedback,
        average_rating: avgRating.toFixed(2),
        total_feedback: feedback.length
      });
    }
  );
});

// Get user's feedback
router.get('/my-feedback', authenticate, (req, res) => {
  const user_id = req.user.id;
  
  db.getDb().all(
    `SELECT f.*, e.title as event_title, e.date, e.department
     FROM feedback f
     JOIN events e ON f.event_id = e.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [user_id],
    (err, feedback) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(feedback);
    }
  );
});

module.exports = router;

