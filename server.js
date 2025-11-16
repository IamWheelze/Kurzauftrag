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
const isAuthenticated = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get client IP address
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress;
};

// ==================== ROUTES ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme123';

  if (username === adminUsername && password === adminPassword) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Logged in successfully' });
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

// Get all products (public)
app.get('/api/products', (req, res) => {
  const clientIp = getClientIp(req);

  db.all(`
    SELECT
      p.*,
      CASE WHEN l.ip_address IS NOT NULL THEN 1 ELSE 0 END as user_liked
    FROM products p
    LEFT JOIN likes l ON p.id = l.product_id AND l.ip_address = ?
    ORDER BY p.created_at DESC
  `, [clientIp], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const clientIp = getClientIp(req);

  db.get(`
    SELECT
      p.*,
      CASE WHEN l.ip_address IS NOT NULL THEN 1 ELSE 0 END as user_liked
    FROM products p
    LEFT JOIN likes l ON p.id = l.product_id AND l.ip_address = ?
    WHERE p.id = ?
  `, [clientIp, req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Create product (admin only)
app.post('/api/products', isAuthenticated, upload.single('image'), (req, res) => {
  const { title, description, category, price } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Image is required' });
  }

  const imagePath = `/uploads/${req.file.filename}`;

  db.run(
    'INSERT INTO products (title, description, category, price, image_path) VALUES (?, ?, ?, ?, ?)',
    [title, description, category, price, imagePath],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        success: true,
        productId: this.lastID,
        message: 'Product created successfully'
      });
    }
  );
});

// Delete product (admin only)
app.delete('/api/products/:id', isAuthenticated, (req, res) => {
  // First get the product to delete the image file
  db.get('SELECT image_path FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (row) {
      // Delete the image file
      const imagePath = path.join(__dirname, 'public', row.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the product from database
    db.run('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, message: 'Product deleted successfully' });
    });
  });
});

// Like/Unlike product
app.post('/api/products/:id/like', (req, res) => {
  const productId = req.params.id;
  const clientIp = getClientIp(req);

  // Check if already liked
  db.get(
    'SELECT id FROM likes WHERE product_id = ? AND ip_address = ?',
    [productId, clientIp],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (row) {
        // Unlike: remove like and decrement count
        db.run('DELETE FROM likes WHERE product_id = ? AND ip_address = ?', [productId, clientIp], (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          db.run('UPDATE products SET likes_count = likes_count - 1 WHERE id = ?', [productId], (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ success: true, action: 'unliked' });
          });
        });
      } else {
        // Like: add like and increment count
        db.run('INSERT INTO likes (product_id, ip_address) VALUES (?, ?)', [productId, clientIp], (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          db.run('UPDATE products SET likes_count = likes_count + 1 WHERE id = ?', [productId], (err) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }
            res.json({ success: true, action: 'liked' });
          });
        });
      }
    }
  );
});

// Get WhatsApp number
app.get('/api/whatsapp', (req, res) => {
  res.json({ number: process.env.WHATSAPP_NUMBER || '' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
