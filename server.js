const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Admin access required' });
  }
};

const isMember = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized - Member access required' });
  }
};

// ==================== ADMIN ROUTES ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

  if (username === adminUsername && password === adminPassword) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Admin logged in successfully' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check admin status
app.get('/api/admin/status', (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// Get all users (admin only)
app.get('/api/admin/users', isAdmin, (req, res) => {
  db.all('SELECT * FROM users ORDER BY joined_date DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get all applications (admin only)
app.get('/api/admin/applications', isAdmin, (req, res) => {
  db.all('SELECT * FROM applications ORDER BY submitted_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Approve application (admin only)
app.post('/api/admin/applications/:id/approve', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Get application
  db.get('SELECT * FROM applications WHERE id = ?', [id], async (err, app) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!app) {
      res.status(404).json({ error: 'Application not found' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account
    db.run(
      'INSERT INTO users (full_name, email, password, phone, profession) VALUES (?, ?, ?, ?, ?)',
      [app.full_name, app.email, hashedPassword, app.phone, app.profession],
      function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Update application status
        db.run('UPDATE applications SET status = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['approved', id],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ success: true, message: 'Application approved and user created' });
          }
        );
      }
    );
  });
});

// Get user goals (admin only)
app.get('/api/admin/users/:userId/goals', isAdmin, (req, res) => {
  db.all('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
    [req.params.userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Create mentor report (admin only)
app.post('/api/admin/reports', isAdmin, (req, res) => {
  const { user_id, report_content, report_type } = req.body;

  db.run(
    'INSERT INTO mentor_reports (user_id, report_content, report_type) VALUES (?, ?, ?)',
    [user_id, report_content, report_type || 'weekly'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, reportId: this.lastID });
    }
  );
});

// Get all progress posts (admin only)
app.get('/api/admin/progress', isAdmin, (req, res) => {
  db.all(`
    SELECT p.*, u.full_name, u.email
    FROM progress_posts p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// ==================== MEMBER ROUTES ====================

// Member registration
app.post('/api/members/register', async (req, res) => {
  const { full_name, email, password, phone, profession } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (full_name, email, password, phone, profession, status) VALUES (?, ?, ?, ?, ?, ?)',
    [full_name, email, hashedPassword, phone, profession, 'active'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          res.status(400).json({ error: 'Email already exists' });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.json({ success: true, userId: this.lastID });
    }
  );
});

// Member login
app.post('/api/members/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login
    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    req.session.userId = user.id;
    req.session.userName = user.full_name;
    res.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        profession: user.profession
      }
    });
  });
});

// Member logout
app.post('/api/members/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Check member status
app.get('/api/members/status', (req, res) => {
  if (req.session.userId) {
    db.get('SELECT id, full_name, email, profession, profile_image FROM users WHERE id = ?',
      [req.session.userId],
      (err, user) => {
        if (err || !user) {
          res.json({ isLoggedIn: false });
          return;
        }
        res.json({ isLoggedIn: true, user });
      }
    );
  } else {
    res.json({ isLoggedIn: false });
  }
});

// ==================== GOALS ROUTES ====================

// Create goal
app.post('/api/goals', isMember, (req, res) => {
  const { week_number, what_to_do, how_to_do, currently_working_on, target_date } = req.body;

  db.run(
    'INSERT INTO goals (user_id, week_number, what_to_do, how_to_do, currently_working_on, target_date) VALUES (?, ?, ?, ?, ?, ?)',
    [req.session.userId, week_number, what_to_do, how_to_do, currently_working_on, target_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, goalId: this.lastID });
    }
  );
});

// Get my goals
app.get('/api/goals', isMember, (req, res) => {
  db.all(
    'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Update goal
app.put('/api/goals/:id', isMember, (req, res) => {
  const { what_to_do, how_to_do, currently_working_on, status } = req.body;

  db.run(
    'UPDATE goals SET what_to_do = ?, how_to_do = ?, currently_working_on = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [what_to_do, how_to_do, currently_working_on, status, req.params.id, req.session.userId],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// ==================== PROGRESS POSTS ROUTES ====================

// Create progress post
app.post('/api/progress', isMember, upload.single('image'), (req, res) => {
  const { content } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    'INSERT INTO progress_posts (user_id, content, image_path) VALUES (?, ?, ?)',
    [req.session.userId, content, imagePath],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, postId: this.lastID });
    }
  );
});

// Get all progress posts (member feed)
app.get('/api/progress', isMember, (req, res) => {
  db.all(`
    SELECT
      p.*,
      u.full_name,
      u.profile_image,
      CASE WHEN pl.user_id IS NOT NULL THEN 1 ELSE 0 END as user_voted
    FROM progress_posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN progress_likes pl ON p.id = pl.post_id AND pl.user_id = ?
    ORDER BY p.created_at DESC
  `, [req.session.userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Vote on progress post (Value Added)
app.post('/api/progress/:id/vote', isMember, (req, res) => {
  const postId = req.params.id;
  const userId = req.session.userId;

  // Check if already voted
  db.get(
    'SELECT id FROM progress_likes WHERE post_id = ? AND user_id = ?',
    [postId, userId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        // Remove vote
        db.run('DELETE FROM progress_likes WHERE post_id = ? AND user_id = ?',
          [postId, userId],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            db.run('UPDATE progress_posts SET value_added_count = value_added_count - 1 WHERE id = ?',
              [postId],
              (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json({ success: true, action: 'unvoted' });
              }
            );
          }
        );
      } else {
        // Add vote
        db.run('INSERT INTO progress_likes (post_id, user_id) VALUES (?, ?)',
          [postId, userId],
          (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            db.run('UPDATE progress_posts SET value_added_count = value_added_count + 1 WHERE id = ?',
              [postId],
              (err) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                res.json({ success: true, action: 'voted' });
              }
            );
          }
        );
      }
    }
  );
});

// ==================== APPLICATION ROUTES ====================

// Submit application
app.post('/api/applications', (req, res) => {
  const { full_name, email, phone, profession, why_join, goals } = req.body;

  db.run(
    'INSERT INTO applications (full_name, email, phone, profession, why_join, goals) VALUES (?, ?, ?, ?, ?, ?)',
    [full_name, email, phone, profession, why_join, goals],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, applicationId: this.lastID });
    }
  );
});

// ==================== TESTIMONIALS ROUTES ====================

// Get all testimonials
app.get('/api/testimonials', (req, res) => {
  db.all('SELECT * FROM testimonials WHERE featured = 1 ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add testimonial (admin only)
app.post('/api/admin/testimonials', isAdmin, upload.single('image'), (req, res) => {
  const { name, role, content, rating } = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  db.run(
    'INSERT INTO testimonials (name, role, content, image_path, rating, featured) VALUES (?, ?, ?, ?, ?, ?)',
    [name, role, content, imagePath, rating || 5, 1],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, testimonialId: this.lastID });
    }
  );
});

// ==================== MENTOR REPORTS ROUTES ====================

// Get my reports
app.get('/api/reports', isMember, (req, res) => {
  db.all(
    'SELECT * FROM mentor_reports WHERE user_id = ? ORDER BY created_at DESC',
    [req.session.userId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mentorship Platform Server running on http://localhost:${PORT}`);
});
