const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get all donations
router.get('/', async (req, res) => {
  try {
    const { category, donation_type, status, city } = req.query;
    let query = `
      SELECT d.*, u.name as donor_name, u.profile_picture as donor_picture
      FROM donations d
      JOIN users u ON d.donor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND d.category = $${params.length}`;
    }

    if (donation_type) {
      params.push(donation_type);
      query += ` AND d.donation_type = $${params.length}`;
    }

    if (city) {
      params.push(`%${city}%`);
      query += ` AND d.location ILIKE $${params.length}`;
    }

    query += ' ORDER BY d.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ donations: result.rows });
  } catch (error) {
    logger.error('Get donations error:', error);
    res.status(500).json({ error: 'Failed to get donations' });
  }
});

// Create donation
router.post('/', async (req, res) => {
  try {
    const {
      title, description, category, donation_type, condition, quantity,
      location, latitude, longitude, images, available_until, is_food, expiry_date
    } = req.body;

    const result = await pool.query(
      `INSERT INTO donations (
        donor_id, title, description, category, donation_type, condition,
        quantity, location, latitude, longitude, images, available_until,
        is_food, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        req.user.id, title, description, category, donation_type || 'give_away',
        condition, quantity || 1, location, latitude, longitude, images || [],
        available_until, is_food || false, expiry_date
      ]
    );

    res.status(201).json({ donation: result.rows[0] });
  } catch (error) {
    logger.error('Create donation error:', error);
    res.status(500).json({ error: 'Failed to create donation' });
  }
});

// Claim donation
router.post('/:donationId/claim', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE donations
       SET recipient_id = $1, status = 'claimed'
       WHERE id = $2 AND status = 'available'
       RETURNING *`,
      [req.user.id, req.params.donationId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Donation not available' });
    }

    const donation = result.rows[0];

    // Award credits to donor
    await client.query(
      'UPDATE users SET time_credits = time_credits + 5 WHERE id = $1',
      [donation.donor_id]
    );

    await client.query(
      `INSERT INTO credit_transactions (to_user_id, amount, transaction_type, reference_type, reference_id, description)
       VALUES ($1, 5, 'donation_reward', 'donation', $2, 'Reward for donation')`,
      [donation.donor_id, donation.id]
    );

    // Notify donor
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES ($1, 'donation_claimed', 'Item Claimed', $2, $3)`,
      [donation.donor_id, `${req.user.name} has claimed your item "${donation.title}"`, `/donations/${donation.id}`]
    );

    await client.query('COMMIT');

    res.json({ donation: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Claim donation error:', error);
    res.status(500).json({ error: 'Failed to claim donation' });
  } finally {
    client.release();
  }
});

// Delete donation
router.delete('/:donationId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM donations WHERE id = $1 AND donor_id = $2 RETURNING *',
      [req.params.donationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found or unauthorized' });
    }

    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    logger.error('Delete donation error:', error);
    res.status(500).json({ error: 'Failed to delete donation' });
  }
});

module.exports = router;
