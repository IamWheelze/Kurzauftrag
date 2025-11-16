const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');
const { authenticateToken } = require('../middleware/auth');

// Get all businesses (public)
router.get('/', async (req, res) => {
  try {
    const { category, city, is_verified } = req.query;
    let query = `
      SELECT b.*, u.name as owner_name
      FROM businesses b
      JOIN users u ON b.owner_id = u.id
      WHERE b.status = 'active'
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND b.category = $${params.length}`;
    }

    if (city) {
      params.push(city);
      query += ` AND b.city = $${params.length}`;
    }

    if (is_verified === 'true') {
      query += ' AND b.is_verified = true';
    }

    query += ' ORDER BY b.is_promoted DESC, b.rating DESC, b.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ businesses: result.rows });
  } catch (error) {
    logger.error('Get businesses error:', error);
    res.status(500).json({ error: 'Failed to get businesses' });
  }
});

// Create business listing (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      business_name, description, category, subcategories, address,
      city, postal_code, phone, email, website, logo_url, images,
      operating_hours
    } = req.body;

    const result = await pool.query(
      `INSERT INTO businesses (
        owner_id, business_name, description, category, subcategories,
        address, city, postal_code, phone, email, website, logo_url,
        images, operating_hours
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        req.user.id, business_name, description, category, subcategories || [],
        address, city, postal_code, phone, email, website, logo_url,
        images || [], operating_hours
      ]
    );

    res.status(201).json({ business: result.rows[0] });
  } catch (error) {
    logger.error('Create business error:', error);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

// Update business
router.put('/:businessId', authenticateToken, async (req, res) => {
  try {
    const {
      business_name, description, phone, email, website, operating_hours
    } = req.body;

    const result = await pool.query(
      `UPDATE businesses
       SET business_name = COALESCE($1, business_name),
           description = COALESCE($2, description),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           website = COALESCE($5, website),
           operating_hours = COALESCE($6, operating_hours)
       WHERE id = $7 AND owner_id = $8
       RETURNING *`,
      [business_name, description, phone, email, website, operating_hours,
       req.params.businessId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found or unauthorized' });
    }

    res.json({ business: result.rows[0] });
  } catch (error) {
    logger.error('Update business error:', error);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

module.exports = router;
