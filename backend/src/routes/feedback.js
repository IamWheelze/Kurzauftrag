const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');
const { authenticateToken } = require('../middleware/auth');

// Submit feedback (public or authenticated)
router.post('/', async (req, res) => {
  try {
    const { subject, message, category, email, name } = req.body;

    // Use authenticated user info if available
    const userId = req.user?.id || null;
    const userEmail = req.user?.email || email;
    const userName = req.user?.name || name;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    if (!userId && !email) {
      return res.status(400).json({ error: 'Email is required for unauthenticated users' });
    }

    const result = await pool.query(
      `INSERT INTO feedback (user_id, email, name, subject, message, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, userEmail, userName, subject, message, category || 'general']
    );

    // Award credits if authenticated
    if (userId) {
      await pool.query(
        'UPDATE users SET time_credits = time_credits + 2 WHERE id = $1',
        [userId]
      );

      await pool.query(
        `INSERT INTO credit_transactions (to_user_id, amount, transaction_type, description)
         VALUES ($1, 2, 'feedback_reward', 'Thank you for your feedback')`,
        [userId]
      );
    }

    res.status(201).json({
      message: 'Feedback submitted successfully. Thank you!',
      feedback: result.rows[0]
    });
  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get user's feedback history (authenticated)
router.get('/my-feedback', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM feedback WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({ feedback: result.rows });
  } catch (error) {
    logger.error('Get feedback error:', error);
    res.status(500).json({ error: 'Failed to get feedback' });
  }
});

module.exports = router;
