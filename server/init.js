// server/init.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'events.db');
let db;

function init() {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ DB connection error:', err);
    else console.log('✅ Connected to SQLite DB at', dbPath);
  });

  db.run('PRAGMA foreign_keys = ON;');

  db.serialize(() => {
    // ===== Users table =====
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        usn TEXT,
        department TEXT,
        semester TEXT,
        role TEXT DEFAULT 'user'
      )
    `);

    // ===== Events table =====
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        date TEXT,
        time TEXT,
        location TEXT,
        department TEXT,
        created_by INTEGER,
        image TEXT,
        max_participants INTEGER,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // ===== Registrations table =====
    db.run(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        user_id INTEGER,
        qr_code TEXT,
        checked_in INTEGER DEFAULT 0,
        usn TEXT,
        semester TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // ===== Notifications table =====
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        event_id INTEGER,
        message TEXT,
        type TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (event_id) REFERENCES events(id)
      )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS proposed_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      department TEXT NOT NULL,
      proposed_by_id INTEGER NOT NULL,
      proposed_by_name TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(proposed_by_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error("Error creating proposed_events table:", err.message);
    else console.log("✅ proposed_events table ready");
  });


  db.run(`
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    proposed_event_id INTEGER NOT NULL,
    vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(proposed_event_id) REFERENCES proposed_events(id)
  )
`, (err) => {
  if (err) console.error("Error creating votes table:", err.message);
  else console.log("✅ votes table ready");
});

  // ===== Feedback table =====
  db.run(`
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) console.error("Error creating feedback table:", err.message);
    else console.log("✅ feedback table ready");
  });

    console.log('✅ Database and tables created/updated successfully!');

    // ===== Hash existing plain-text passwords =====
    db.all('SELECT id, password FROM users', [], (err, rows) => {
      if (err) return console.error('❌ Error fetching users:', err.message);

      rows.forEach(row => {
        if (row.password && !row.password.startsWith('$2')) { // not hashed
          const hashed = bcrypt.hashSync(row.password, 10);
          db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, row.id], err => {
            if (err) console.error(`❌ Failed to update user ${row.id}:`, err.message);
          });
        }
      });

      console.log('✅ Existing passwords hashed successfully!');
    });
  });
}

// Getter for db
function getDb() {
  if (!db) throw new Error('Database not initialized. Call init() first.');
  return db;
}

module.exports = { init, getDb };
