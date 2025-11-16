const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get user's credit balance
router.get('/balance', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT time_credits FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({ balance: result.rows[0].time_credits });
  } catch (error) {
    logger.error('Get balance error:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Get credit transaction history
router.get('/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ct.*,
              u1.name as from_user_name,
              u2.name as to_user_name
       FROM credit_transactions ct
       LEFT JOIN users u1 ON ct.from_user_id = u1.id
       LEFT JOIN users u2 ON ct.to_user_id = u2.id
       WHERE ct.from_user_id = $1 OR ct.to_user_id = $1
       ORDER BY ct.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Transfer credits to another user
router.post('/transfer', async (req, res) => {
  const client = await pool.connect();

  try {
    const { to_user_id, amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    await client.query('BEGIN');

    // Check balance
    const balanceResult = await client.query(
      'SELECT time_credits FROM users WHERE id = $1',
      [req.user.id]
    );

    if (balanceResult.rows[0].time_credits < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    // Deduct from sender
    await client.query(
      'UPDATE users SET time_credits = time_credits - $1 WHERE id = $2',
      [amount, req.user.id]
    );

    // Add to recipient
    await client.query(
      'UPDATE users SET time_credits = time_credits + $1 WHERE id = $2',
      [amount, to_user_id]
    );

    // Record transaction
    const result = await client.query(
      `INSERT INTO credit_transactions (from_user_id, to_user_id, amount, transaction_type, description)
       VALUES ($1, $2, $3, 'transfer', $4)
       RETURNING *`,
      [req.user.id, to_user_id, amount, description]
    );

    // Notify recipient
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'credits_received', 'Credits Received', $2)`,
      [to_user_id, `You received ${amount} time credits from ${req.user.name}`]
    );

    await client.query('COMMIT');

    res.json({ transaction: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transfer credits error:', error);
    res.status(500).json({ error: 'Failed to transfer credits' });
  } finally {
    client.release();
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, profile_picture, time_credits, reputation_score
       FROM users
       WHERE time_credits > 0
       ORDER BY time_credits DESC
       LIMIT 50`
    );

    res.json({ leaderboard: result.rows });
  } catch (error) {
    logger.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;
