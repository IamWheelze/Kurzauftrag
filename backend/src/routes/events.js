const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get all events
router.get('/', async (req, res) => {
  try {
    const { event_type, start_date, end_date, city } = req.query;
    let query = `
      SELECT e.*, u.name as organizer_name, u.profile_picture as organizer_picture
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.status != 'cancelled'
    `;
    const params = [];

    if (event_type) {
      params.push(event_type);
      query += ` AND e.event_type = $${params.length}`;
    }

    if (start_date) {
      params.push(start_date);
      query += ` AND e.start_date >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND e.start_date <= $${params.length}`;
    }

    if (city) {
      params.push(`%${city}%`);
      query += ` AND e.location ILIKE $${params.length}`;
    }

    query += ' ORDER BY e.start_date ASC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ events: result.rows });
  } catch (error) {
    logger.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// Get single event with attendees
router.get('/:eventId', async (req, res) => {
  try {
    const eventResult = await pool.query(
      `SELECT e.*, u.name as organizer_name, u.profile_picture as organizer_picture
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [req.params.eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const attendeesResult = await pool.query(
      `SELECT ea.*, u.name, u.profile_picture
       FROM event_attendees ea
       JOIN users u ON ea.user_id = u.id
       WHERE ea.event_id = $1`,
      [req.params.eventId]
    );

    res.json({
      event: eventResult.rows[0],
      attendees: attendeesResult.rows
    });
  } catch (error) {
    logger.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to get event' });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const {
      title, description, event_type, location, latitude, longitude,
      start_date, end_date, max_attendees, is_public, tags, image_url
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events (
        organizer_id, title, description, event_type, location,
        latitude, longitude, start_date, end_date, max_attendees,
        is_public, tags, image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        req.user.id, title, description, event_type, location,
        latitude, longitude, start_date, end_date, max_attendees,
        is_public !== false, tags || [], image_url
      ]
    );

    // Create calendar event for organizer
    await pool.query(
      `INSERT INTO calendar_events (
        user_id, title, description, start_time, end_time, location,
        event_type, reference_type, reference_id
      ) VALUES ($1, $2, $3, $4, $5, $6, 'community_event', 'event', $7)`,
      [req.user.id, title, description, start_date, end_date, location, result.rows[0].id]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    logger.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Register for event
router.post('/:eventId/register', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if event is full
    const eventResult = await client.query(
      'SELECT * FROM events WHERE id = $1',
      [req.params.eventId]
    );

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    if (event.max_attendees && event.current_attendees >= event.max_attendees) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Event is full' });
    }

    // Check if already registered
    const existingResult = await client.query(
      'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [req.params.eventId, req.user.id]
    );

    if (existingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Already registered' });
    }

    // Register attendee
    await client.query(
      'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)',
      [req.params.eventId, req.user.id]
    );

    // Update attendee count
    await client.query(
      'UPDATE events SET current_attendees = current_attendees + 1 WHERE id = $1',
      [req.params.eventId]
    );

    // Add to user's calendar
    await client.query(
      `INSERT INTO calendar_events (
        user_id, title, description, start_time, end_time, location,
        event_type, reference_type, reference_id
      ) VALUES ($1, $2, $3, $4, $5, $6, 'community_event', 'event', $7)`,
      [req.user.id, event.title, event.description, event.start_date,
       event.end_date, event.location, event.id]
    );

    // Notify organizer
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES ($1, 'event_registration', 'New Event Registration', $2, $3)`,
      [event.organizer_id, `${req.user.name} registered for "${event.title}"`, `/events/${event.id}`]
    );

    await client.query('COMMIT');

    res.json({ message: 'Registered successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Register event error:', error);
    res.status(500).json({ error: 'Failed to register' });
  } finally {
    client.release();
  }
});

// Unregister from event
router.delete('/:eventId/register', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2 RETURNING *',
      [req.params.eventId, req.user.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not registered' });
    }

    await client.query(
      'UPDATE events SET current_attendees = current_attendees - 1 WHERE id = $1',
      [req.params.eventId]
    );

    await client.query('COMMIT');

    res.json({ message: 'Unregistered successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Unregister event error:', error);
    res.status(500).json({ error: 'Failed to unregister' });
  } finally {
    client.release();
  }
});

// Update event (organizer only)
router.put('/:eventId', async (req, res) => {
  try {
    const { title, description, start_date, end_date, location, status } = req.body;

    const result = await pool.query(
      `UPDATE events
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           location = COALESCE($5, location),
           status = COALESCE($6, status)
       WHERE id = $7 AND organizer_id = $8
       RETURNING *`,
      [title, description, start_date, end_date, location, status,
       req.params.eventId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    res.json({ event: result.rows[0] });
  } catch (error) {
    logger.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Cancel event (organizer only)
router.delete('/:eventId', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      'SELECT * FROM events WHERE id = $1 AND organizer_id = $2',
      [req.params.eventId, req.user.id]
    );

    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    const event = eventResult.rows[0];

    // Update status instead of deleting
    await client.query(
      'UPDATE events SET status = $1 WHERE id = $2',
      ['cancelled', req.params.eventId]
    );

    // Notify all attendees
    const attendees = await client.query(
      'SELECT user_id FROM event_attendees WHERE event_id = $1',
      [req.params.eventId]
    );

    for (const attendee of attendees.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, priority)
         VALUES ($1, 'event_cancelled', 'Event Cancelled', $2, 'high')`,
        [attendee.user_id, `The event "${event.title}" has been cancelled`]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Event cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Cancel event error:', error);
    res.status(500).json({ error: 'Failed to cancel event' });
  } finally {
    client.release();
  }
});

module.exports = router;
