// server/routes/votes.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const db = require('../init');

const router = express.Router();

// Middleware: only organisers can propose events
const organiserOnly = (req, res, next) => {
  if (req.user.role !== 'organiser') {
    return res.status(403).json({ error: 'Access denied: Only organisers can propose events' });
  }
  next();
};

// ===== Propose a new event (ORGANISERS ONLY) =====
router.post('/propose', authenticate, organiserOnly, (req, res) => {
  const { title, description, department } = req.body;
  const userId = req.user.id;

  if (!title || !description || !department) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Fetch user name from database
  db.getDb().get('SELECT name FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error fetching user:', err);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }

    const userName = user?.name || 'Organiser';

    const sql = `
      INSERT INTO proposed_events 
        (title, description, department, proposed_by_id, proposed_by_name) 
      VALUES (?, ?, ?, ?, ?)
    `;

    db.getDb().run(sql, [title, description, department, userId, userName], function(err) {
      if (err) {
        console.error('Error proposing event:', err);
        return res.status(500).json({ error: 'Failed to propose event' });
      }
      res.status(201).json({ message: 'Event proposed successfully', id: this.lastID });
    });
  });
});

// ===== Get all proposed events =====
router.get('/proposed', authenticate, (req, res) => {
  const sql = `
    SELECT p.*, 
           COALESCE(SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE 0 END), 0) AS upvotes,
           COALESCE(SUM(CASE WHEN v.vote_type = 'down' THEN 1 ELSE 0 END), 0) AS downvotes
    FROM proposed_events p
    LEFT JOIN votes v ON p.id = v.proposed_event_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.getDb().all(sql, [], (err, proposals) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch proposed events' });
    }
    res.json(proposals);
  });
});

// ===== Vote on a proposed event (STUDENTS ONLY) =====
router.post('/vote', authenticate, (req, res) => {
  const { proposed_event_id, vote_type } = req.body;
  const user = req.user;

  if (user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can vote' });
  }

  if (!['up', 'down'].includes(vote_type)) {
    return res.status(400).json({ error: 'Invalid vote type' });
  }

  const dbInstance = db.getDb();

  // Check if user already voted
  dbInstance.get(
    'SELECT * FROM votes WHERE proposed_event_id = ? AND user_id = ?',
    [proposed_event_id, user.id],
    (err, existingVote) => {
      if (err) return res.status(500).json({ error: err.message });

      if (existingVote) {
        // Update vote if different, or remove if same
        if (existingVote.vote_type === vote_type) {
          dbInstance.run(
            'DELETE FROM votes WHERE id = ?',
            [existingVote.id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ message: 'Vote removed' });
            }
          );
        } else {
          dbInstance.run(
            'UPDATE votes SET vote_type = ? WHERE id = ?',
            [vote_type, existingVote.id],
            function(err) {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ message: 'Vote updated' });
            }
          );
        }
      } else {
        dbInstance.run(
          'INSERT INTO votes (user_id, proposed_event_id, vote_type) VALUES (?, ?, ?)',
          [user.id, proposed_event_id, vote_type],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Vote added' });
          }
        );
      }
    }
  );
});

// ===== Get current user's vote for a proposed event =====
router.get('/my-vote/:proposed_event_id', authenticate, (req, res) => {
  const { proposed_event_id } = req.params;
  const user_id = req.user.id;

  db.getDb().get(
    'SELECT vote_type FROM votes WHERE proposed_event_id = ? AND user_id = ?',
    [proposed_event_id, user_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ vote_type: row?.vote_type || null });
    }
  );
});

module.exports = router;
