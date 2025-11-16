const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, profile_picture, bio, city, reputation_score,
              total_ratings, time_credits, is_verified, created_at
       FROM users WHERE id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update own profile
router.put('/profile', async (req, res) => {
  try {
    const { name, bio, phone, address, city, postal_code, is_elderly } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           bio = COALESCE($2, bio),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           postal_code = COALESCE($6, postal_code),
           is_elderly = COALESCE($7, is_elderly)
       WHERE id = $8
       RETURNING id, email, name, profile_picture, phone, bio, city,
                 reputation_score, time_credits, is_verified`,
      [name, bio, phone, address, city, postal_code, is_elderly, req.user.id]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user statistics
router.get('/:userId/stats', async (req, res) => {
  try {
    const stats = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM tasks WHERE creator_id = $1) as tasks_created,
        (SELECT COUNT(*) FROM tasks WHERE assignee_id = $1 AND status = 'completed') as tasks_completed,
        (SELECT COUNT(*) FROM donations WHERE donor_id = $1) as items_donated,
        (SELECT COUNT(*) FROM ratings WHERE ratee_id = $1) as reviews_received,
        (SELECT AVG(rating) FROM ratings WHERE ratee_id = $1) as average_rating`,
      [req.params.userId]
    );

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;
