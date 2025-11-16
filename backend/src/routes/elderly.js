const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get all elderly assistance requests
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT ea.*,
             u1.name as elderly_name, u1.profile_picture as elderly_picture,
             u2.name as helper_name,
             u3.name as monitor_name
      FROM elderly_assistance ea
      JOIN users u1 ON ea.elderly_user_id = u1.id
      LEFT JOIN users u2 ON ea.helper_id = u2.id
      LEFT JOIN users u3 ON ea.family_monitor_id = u3.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND ea.status = $${params.length}`;
    }

    query += ' ORDER BY ea.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (error) {
    logger.error('Get elderly assistance error:', error);
    res.status(500).json({ error: 'Failed to get requests' });
  }
});

// Create assistance request
router.post('/', async (req, res) => {
  try {
    const {
      assistance_type, description, schedule_type, schedule_data,
      emergency_contact, medical_notes, family_monitor_id
    } = req.body;

    const result = await pool.query(
      `INSERT INTO elderly_assistance (
        elderly_user_id, assistance_type, description, schedule_type,
        schedule_data, emergency_contact, medical_notes, family_monitor_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [req.user.id, assistance_type, description, schedule_type,
       schedule_data, emergency_contact, medical_notes, family_monitor_id]
    );

    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    logger.error('Create assistance request error:', error);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// Accept assistance request
router.post('/:requestId/accept', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE elderly_assistance
       SET helper_id = $1, status = 'assigned'
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [req.user.id, req.params.requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not available' });
    }

    // Notify elderly user and family monitor
    const request = result.rows[0];
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES ($1, 'assistance_accepted', 'Help is on the way', $2, $3)`,
      [request.elderly_user_id, `${req.user.name} has accepted your assistance request`, `/elderly/${request.id}`]
    );

    if (request.family_monitor_id) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'assistance_accepted', 'Assistance Assigned', $2, $3)`,
        [request.family_monitor_id, `Helper assigned for your monitored family member`, `/elderly/${request.id}`]
      );
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    logger.error('Accept assistance error:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Check-in
router.post('/:requestId/checkin', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE elderly_assistance
       SET last_check_in = CURRENT_TIMESTAMP, alert_triggered = FALSE
       WHERE id = $1
       RETURNING *`,
      [req.params.requestId]
    );

    res.json({ request: result.rows[0] });
  } catch (error) {
    logger.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check-in' });
  }
});

module.exports = router;
