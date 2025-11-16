const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get user's calendar events
router.get('/events', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = 'SELECT * FROM calendar_events WHERE user_id = $1';
    const params = [req.user.id];

    if (start_date) {
      params.push(start_date);
      query += ` AND start_time >= $${params.length}`;
    }

    if (end_date) {
      params.push(end_date);
      query += ` AND start_time <= $${params.length}`;
    }

    query += ' ORDER BY start_time ASC';

    const result = await pool.query(query, params);

    res.json({ events: result.rows });
  } catch (error) {
    logger.error('Get calendar events error:', error);
    res.status(500).json({ error: 'Failed to get calendar events' });
  }
});

// Get holidays
router.get('/holidays', async (req, res) => {
  try {
    const { country = 'Germany', year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const result = await pool.query(
      `SELECT * FROM holidays
       WHERE country = $1 AND year = $2
       ORDER BY date ASC`,
      [country, currentYear]
    );

    res.json({ holidays: result.rows });
  } catch (error) {
    logger.error('Get holidays error:', error);
    res.status(500).json({ error: 'Failed to get holidays' });
  }
});

// Get upcoming holidays (with cultural context for newcomers)
router.get('/holidays/upcoming', async (req, res) => {
  try {
    const { country = 'Germany', days = 30 } = req.query;

    const result = await pool.query(
      `SELECT * FROM holidays
       WHERE country = $1
       AND date >= CURRENT_DATE
       AND date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
       ORDER BY date ASC`,
      [country]
    );

    res.json({ holidays: result.rows });
  } catch (error) {
    logger.error('Get upcoming holidays error:', error);
    res.status(500).json({ error: 'Failed to get upcoming holidays' });
  }
});

// Sync with Google Calendar
router.post('/sync/google', async (req, res) => {
  try {
    // Get user's Google tokens
    const tokenResult = await pool.query(
      'SELECT access_token, refresh_token FROM user_tokens WHERE user_id = $1 AND provider = $2',
      [req.user.id, 'google']
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const { access_token, refresh_token } = tokenResult.rows[0];

    // Initialize Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token,
      refresh_token
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch events from Google Calendar
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items;

    // Sync events to our database
    for (const event of events) {
      await pool.query(
        `INSERT INTO calendar_events (
          user_id, google_event_id, title, description, start_time,
          end_time, location, is_synced
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        ON CONFLICT (user_id, google_event_id)
        DO UPDATE SET title = $3, description = $4, start_time = $5,
                      end_time = $6, location = $7, is_synced = true`,
        [
          req.user.id,
          event.id,
          event.summary,
          event.description,
          event.start.dateTime || event.start.date,
          event.end.dateTime || event.end.date,
          event.location
        ]
      );
    }

    res.json({ message: 'Calendar synced successfully', count: events.length });
  } catch (error) {
    logger.error('Sync calendar error:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

// Create calendar event
router.post('/events', async (req, res) => {
  try {
    const {
      title, description, start_time, end_time, location,
      event_type, reference_type, reference_id, reminder_minutes
    } = req.body;

    const result = await pool.query(
      `INSERT INTO calendar_events (
        user_id, title, description, start_time, end_time, location,
        event_type, reference_type, reference_id, reminder_minutes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.user.id, title, description, start_time, end_time, location,
        event_type, reference_type, reference_id, reminder_minutes || [15]
      ]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    logger.error('Create calendar event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

module.exports = router;
