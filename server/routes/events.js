const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('../init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// CREATE EVENT
router.post('/create-event', authMiddleware, upload.single('image'), (req, res) => {
  const { title, description, department, date, time, location, max_participants } = req.body;
  if (!title || !department || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const createdBy = req.user.id;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  db.getDb().run(
    `INSERT INTO events (title, description, department, date, time, location, max_participants, created_by, image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || '', department, date, time, location || '', max_participants || null, createdBy, imagePath],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Event created successfully', eventId: this.lastID });
    }
  );
});

// GET ALL EVENTS with optional filtering, sorting, search
router.get('/', (req, res) => {
  const { department, sort, search } = req.query;
  let query = `
    SELECT e.*, u.name AS organiser_name
    FROM events e
    LEFT JOIN users u ON e.created_by = u.id
  `;
  const params = [];

  // Filters
  const filters = [];
  if (department) {
    filters.push(`e.department = ?`);
    params.push(department);
  }
  if (search) {
    filters.push(`e.title LIKE ?`);
    params.push(`%${search}%`);
  }
  if (filters.length) {
    query += ` WHERE ` + filters.join(' AND ');
  }

  // Sorting
  const order = sort === 'asc' ? 'ASC' : 'DESC'; // default DESC
  query += ` ORDER BY e.date ${order}, e.time ${order}`;

  db.getDb().all(query, params, (err, events) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: events });
  });
});

// GET SINGLE EVENT
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.getDb().get(
    `SELECT e.*, u.name AS organiser_name
     FROM events e
     LEFT JOIN users u ON e.created_by = u.id
     WHERE e.id = ?`,
    [id],
    (err, event) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
      res.json({ success: true, data: event });
    }
  );
});

// UPDATE EVENT
router.put('/update-event/:id', authMiddleware, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const organiserId = req.user.id;
  const { title, description, department, date, time, location, max_participants, status } = req.body;

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

  if (!fields.length) return res.status(400).json({ error: 'No fields provided for update' });

  values.push(id, organiserId);

  const query = `UPDATE events SET ${fields.join(', ')} WHERE id = ? AND created_by = ?`;

  db.getDb().run(query, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Event not found or unauthorized' });
    res.json({ message: 'Event updated successfully' });
  });
});

module.exports = router;
