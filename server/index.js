// ====== Imports ======
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { getDb, init } = require('./init');
const reminderService = require('./services/reminderService');

// ====== Initialize App ======
const app = express();
const PORT = process.env.PORT || 5001;

// ====== Initialize Database FIRST ======
init();
const db = getDb();

// ====== Middleware ======
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== Static Uploads ======
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== Multer Setup ======
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ====== Hash Existing Plain-text Passwords ======
db.all('SELECT id, password FROM users', [], (err, rows) => {
  if (err) return console.error('❌ Error fetching users:', err.message);

  rows.forEach((row) => {
    if (row.password && row.password.startsWith('$2')) return;
    if (row.password) {
      const hashed = bcrypt.hashSync(row.password, 10);
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashed, row.id],
        (err) => {
          if (err)
            console.error(`❌ Failed to update user ${row.id}:`, err.message);
        }
      );
    }
  });

  console.log('✅ Plain-text passwords hashed successfully!');
});

// ====== Routes ======
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/organiser', require('./routes/organiser'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/notifications', require('./routes/notifications'));

// ✅ QR Code Routes
app.use('/api/qrcode', require('./routes/qrcode')); // Generate QR
app.use('/api/scan-qr', require('./routes/scanQR')); // Scan QR + mark attendance

// ====== Upload Endpoint ======
app.post('/api/upload-event-image', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// ====== Health Check ======
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Server is running' })
);
app.get('/', (req, res) => res.send('Backend server is running ✅'));

// ====== Reminder Service ======
reminderService.init();

// ====== Start Server ======
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
