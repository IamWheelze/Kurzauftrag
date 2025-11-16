const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as rater_name, u.profile_picture as rater_picture
       FROM ratings r
       JOIN users u ON r.rater_id = u.id
       WHERE r.ratee_id = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [req.params.userId]
    );

    res.json({ ratings: result.rows });
  } catch (error) {
    logger.error('Get ratings error:', error);
    res.status(500).json({ error: 'Failed to get ratings' });
  }
});

// Create rating
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const { ratee_id, reference_type, reference_id, rating, review, tags } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (ratee_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot rate yourself' });
    }

    await client.query('BEGIN');

    // Create rating
    const ratingResult = await client.query(
      `INSERT INTO ratings (rater_id, ratee_id, reference_type, reference_id, rating, review, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, ratee_id, reference_type, reference_id, rating, review, tags || []]
    );

    // Update user's reputation score
    const avgResult = await client.query(
      'SELECT AVG(rating)::NUMERIC(3,2) as avg_rating, COUNT(*) as total FROM ratings WHERE ratee_id = $1',
      [ratee_id]
    );

    await client.query(
      'UPDATE users SET reputation_score = $1, total_ratings = $2 WHERE id = $3',
      [avgResult.rows[0].avg_rating, avgResult.rows[0].total, ratee_id]
    );

    // Award credits for giving rating
    await client.query(
      'UPDATE users SET time_credits = time_credits + 1 WHERE id = $1',
      [req.user.id]
    );

    await client.query(
      `INSERT INTO credit_transactions (to_user_id, amount, transaction_type, description)
       VALUES ($1, 1, 'rating_reward', 'Reward for providing rating')`,
      [req.user.id]
    );

    // Notify ratee
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES ($1, 'new_rating', 'New Rating', $2, $3)`,
      [ratee_id, `${req.user.name} rated you ${rating} stars`, `/profile`]
    );

    await client.query('COMMIT');

    res.status(201).json({ rating: ratingResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'You have already rated this' });
    }

    logger.error('Create rating error:', error);
    res.status(500).json({ error: 'Failed to create rating' });
  } finally {
    client.release();
  }
});

// Mark rating as helpful
router.post('/:ratingId/helpful', async (req, res) => {
  try {
    await pool.query(
      'UPDATE ratings SET helpful_count = helpful_count + 1 WHERE id = $1',
      [req.params.ratingId]
    );

    res.json({ message: 'Marked as helpful' });
  } catch (error) {
    logger.error('Mark helpful error:', error);
    res.status(500).json({ error: 'Failed to mark as helpful' });
  }
});

module.exports = router;
