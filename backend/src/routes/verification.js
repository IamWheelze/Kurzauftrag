const express = require('express');
const router = express.Router();
const multer = require('multer');
const { pool } = require('../config/database');
const logger = require('../config/logger');
const { requireRole } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDFs allowed.'));
    }
  }
});

// Submit verification document
router.post('/submit', upload.single('document'), async (req, res) => {
  try {
    const { document_type } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Document file required' });
    }

    const document_url = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO verification_documents (user_id, document_type, document_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.user.id, document_type, document_url]
    );

    // Notify admins
    const admins = await pool.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    for (const admin of admins.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, priority, action_url)
         VALUES ($1, 'verification_submitted', 'New Verification Request', $2, 'high', $3)`,
        [admin.id, `${req.user.name} submitted verification documents`, `/admin/verifications`]
      );
    }

    res.status(201).json({
      message: 'Verification submitted successfully',
      document: result.rows[0]
    });
  } catch (error) {
    logger.error('Submit verification error:', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

// Get user's verification status
router.get('/status', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM verification_documents
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    res.json({
      is_verified: req.user.is_verified,
      latest_submission: result.rows[0] || null
    });
  } catch (error) {
    logger.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Get pending verifications (admin only)
router.get('/pending', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vd.*, u.name, u.email, u.profile_picture
       FROM verification_documents vd
       JOIN users u ON vd.user_id = u.id
       WHERE vd.status = 'pending'
       ORDER BY vd.created_at ASC`
    );

    res.json({ verifications: result.rows });
  } catch (error) {
    logger.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get verifications' });
  }
});

// Approve verification (admin only)
router.post('/:verificationId/approve', requireRole(['admin', 'moderator']), async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { notes } = req.body;

    // Update verification document
    const docResult = await client.query(
      `UPDATE verification_documents
       SET status = 'approved',
           verified_by = $1,
           verified_at = CURRENT_TIMESTAMP,
           notes = $2
       WHERE id = $3
       RETURNING *`,
      [req.user.id, notes, req.params.verificationId]
    );

    if (docResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Verification not found' });
    }

    const doc = docResult.rows[0];

    // Mark user as verified
    await client.query(
      'UPDATE users SET is_verified = true WHERE id = $1',
      [doc.user_id]
    );

    // Award verification credits
    await client.query(
      'UPDATE users SET time_credits = time_credits + 50 WHERE id = $1',
      [doc.user_id]
    );

    await client.query(
      `INSERT INTO credit_transactions (to_user_id, amount, transaction_type, description)
       VALUES ($1, 50, 'verification_reward', 'Welcome bonus for verification')`,
      [doc.user_id]
    );

    // Notify user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, priority)
       VALUES ($1, 'verification_approved', 'Verification Approved! 🎉', $2, 'high')`,
      [doc.user_id, 'Your account has been verified! You received 50 time credits as a welcome bonus.']
    );

    await client.query('COMMIT');

    res.json({ message: 'Verification approved', document: docResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  } finally {
    client.release();
  }
});

// Reject verification (admin only)
router.post('/:verificationId/reject', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE verification_documents
       SET status = 'rejected',
           verified_by = $1,
           verified_at = CURRENT_TIMESTAMP,
           notes = $2
       WHERE id = $3
       RETURNING *`,
      [req.user.id, notes, req.params.verificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    const doc = result.rows[0];

    // Notify user
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, priority)
       VALUES ($1, 'verification_rejected', 'Verification Needs Attention', $2, 'high')`,
      [doc.user_id, `Your verification was not approved. Reason: ${notes || 'Please submit clearer documents.'}`]
    );

    res.json({ message: 'Verification rejected', document: result.rows[0] });
  } catch (error) {
    logger.error('Reject verification error:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
});

module.exports = router;
