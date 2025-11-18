const cron = require('node-cron');
const { pool } = require('../config/database');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');

// Run daily at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  logger.info('Running daily tasks scheduler...');

  try {
    // Send holiday reminders (7 days before)
    const upcomingHolidays = await pool.query(
      `SELECT * FROM holidays
       WHERE date = CURRENT_DATE + INTERVAL '7 days'
       AND country = 'Germany'`
    );

    if (upcomingHolidays.rows.length > 0) {
      // Get all users
      const users = await pool.query('SELECT * FROM users WHERE email IS NOT NULL');

      for (const user of users.rows) {
        for (const holiday of upcomingHolidays.rows) {
          await sendEmail(user.email, 'holidayReminder', { user, holiday });

          // Create notification
          await pool.query(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES ($1, 'holiday_reminder', $2, $3)`,
            [user.id, `Upcoming: ${holiday.name}`, holiday.cultural_context || holiday.description]
          );
        }
      }

      logger.info(`Sent holiday reminders for ${upcomingHolidays.rows.length} holidays`);
    }

    // Send event reminders (1 day before)
    const upcomingEvents = await pool.query(
      `SELECT e.*, ea.user_id, u.email, u.name
       FROM events e
       JOIN event_attendees ea ON e.id = ea.event_id
       JOIN users u ON ea.user_id = u.id
       WHERE e.start_date::date = CURRENT_DATE + INTERVAL '1 day'
       AND e.status = 'upcoming'`
    );

    for (const row of upcomingEvents.rows) {
      await sendEmail(row.email, 'eventReminder', { user: { name: row.name }, event: row });

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'event_reminder', $2, $3, $4)`,
        [row.user_id, `Event Tomorrow: ${row.title}`, row.description, `/events/${row.id}`]
      );
    }

    logger.info(`Sent event reminders for ${upcomingEvents.rows.length} events`);

    // Mark expired donations as unavailable
    const expired = await pool.query(
      `UPDATE donations
       SET status = 'expired'
       WHERE available_until < CURRENT_DATE
       AND status = 'available'
       RETURNING id`
    );

    logger.info(`Marked ${expired.rows.length} donations as expired`);

    // Check for elderly assistance alerts (no check-in for 24 hours)
    const elderlyAlerts = await pool.query(
      `SELECT ea.*, u.name, u.email, fm.email as monitor_email
       FROM elderly_assistance ea
       JOIN users u ON ea.elderly_user_id = u.id
       LEFT JOIN users fm ON ea.family_monitor_id = fm.id
       WHERE ea.last_check_in < CURRENT_TIMESTAMP - INTERVAL '24 hours'
       AND ea.status = 'assigned'
       AND ea.alert_triggered = false`
    );

    for (const alert of elderlyAlerts.rows) {
      // Mark alert as triggered
      await pool.query(
        'UPDATE elderly_assistance SET alert_triggered = true WHERE id = $1',
        [alert.id]
      );

      // Notify family monitor
      if (alert.family_monitor_id) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, priority)
           VALUES ($1, 'elderly_alert', 'Welfare Check Needed', $2, 'urgent')`,
          [alert.family_monitor_id, `No check-in from ${alert.name} for 24 hours`]
        );
      }

      logger.warn(`Elderly assistance alert triggered for user ${alert.elderly_user_id}`);
    }

  } catch (error) {
    logger.error('Scheduler error:', error);
  }
});

// Clean up old notifications (run weekly on Sunday at 2:00 AM)
cron.schedule('0 2 * * 0', async () => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications
       WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
       AND is_read = true`
    );

    logger.info(`Cleaned up ${result.rowCount} old notifications`);
  } catch (error) {
    logger.error('Notification cleanup error:', error);
  }
});

logger.info('Schedulers initialized');

module.exports = { /* schedulers are automatically started */ };
