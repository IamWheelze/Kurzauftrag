const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'mentorship.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Users/Mentees table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      profession TEXT,
      status TEXT DEFAULT 'pending',
      joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      profile_image TEXT
    )
  `);

  // Applications table
  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      profession TEXT,
      why_join TEXT,
      goals TEXT,
      status TEXT DEFAULT 'pending',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_by INTEGER,
      reviewed_at DATETIME
    )
  `);

  // Goals table (weekly goal tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      what_to_do TEXT NOT NULL,
      how_to_do TEXT NOT NULL,
      currently_working_on TEXT,
      target_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Progress posts (social feed)
  db.run(`
    CREATE TABLE IF NOT EXISTS progress_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_path TEXT,
      value_added_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Progress likes (Value Added votes)
  db.run(`
    CREATE TABLE IF NOT EXISTS progress_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES progress_posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id)
    )
  `);

  // Mentor reports
  db.run(`
    CREATE TABLE IF NOT EXISTS mentor_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_content TEXT NOT NULL,
      report_type TEXT DEFAULT 'weekly',
      created_by TEXT DEFAULT 'Egbodofo Joshua',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Testimonials
  db.run(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      content TEXT NOT NULL,
      image_path TEXT,
      rating INTEGER DEFAULT 5,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Email reminders log
  db.run(`
    CREATE TABLE IF NOT EXISTS email_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_id INTEGER,
      reminder_type TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'sent',
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (goal_id) REFERENCES goals(id)
    )
  `);

  console.log('Mentorship database initialized successfully');
});

module.exports = db;
