const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');
const { requireRole } = require('../middleware/auth');

// All admin routes require admin role
router.use(requireRole(['admin']));

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_verified = true) as verified_users,
        (SELECT COUNT(*) FROM users WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as new_users_week,
        (SELECT COUNT(*) FROM tasks) as total_tasks,
        (SELECT COUNT(*) FROM tasks WHERE status = 'completed') as completed_tasks,
        (SELECT COUNT(*) FROM donations) as total_donations,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM forum_posts) as total_posts,
        (SELECT SUM(time_credits) FROM users) as total_credits,
        (SELECT COUNT(*) FROM credit_transactions WHERE created_at > CURRENT_DATE - INTERVAL '7 days') as transactions_week
    `);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    logger.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const activity = await pool.query(
      `SELECT 'user_registered' as type, u.name, u.email, u.created_at as timestamp
       FROM users u
       UNION ALL
       SELECT 'task_created' as type, u.name, t.title as email, t.created_at as timestamp
       FROM tasks t
       JOIN users u ON t.creator_id = u.id
       UNION ALL
       SELECT 'donation_created' as type, u.name, d.title as email, d.created_at as timestamp
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       ORDER BY timestamp DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({ activity: activity.rows });
  } catch (error) {
    logger.error('Get activity error:', error);
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// Get all users (with pagination)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, name, email, role, is_verified, reputation_score,
             time_credits, created_at, last_login
      FROM users
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE name ILIKE $${params.length} OR email ILIKE $${params.length}`;
    }

    params.push(parseInt(limit), offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const users = await pool.query(query, params);

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user role
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'verified', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User ${req.params.userId} role updated to ${role} by ${req.user.id}`);
    res.json({ user: result.rows[0] });
  } catch (error) {
    logger.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Ban/Unban user
router.put('/users/:userId/ban', async (req, res) => {
  try {
    const { banned, reason } = req.body;

    await pool.query(
      'UPDATE users SET is_banned = $1, ban_reason = $2 WHERE id = $3',
      [banned, reason, req.params.userId]
    );

    if (banned) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, priority)
         VALUES ($1, 'account_banned', 'Account Suspended', $2, 'urgent')`,
        [req.params.userId, `Your account has been suspended. Reason: ${reason}`]
      );
    }

    logger.warn(`User ${req.params.userId} ${banned ? 'banned' : 'unbanned'} by ${req.user.id}`);
    res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
  } catch (error) {
    logger.error('Ban user error:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// Get flagged content
router.get('/flagged', async (req, res) => {
  try {
    const flagged = await pool.query(
      `SELECT 'forum_post' as type, fp.id, fp.title as content, u.name as author,
              fp.created_at, COUNT(r.id) as flag_count
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       LEFT JOIN reports r ON r.content_type = 'forum_post' AND r.content_id = fp.id
       GROUP BY fp.id, fp.title, u.name, fp.created_at
       HAVING COUNT(r.id) > 0
       ORDER BY flag_count DESC, fp.created_at DESC
       LIMIT 50`
    );

    res.json({ flagged: flagged.rows });
  } catch (error) {
    logger.error('Get flagged content error:', error);
    res.status(500).json({ error: 'Failed to get flagged content' });
  }
});

// Delete content
router.delete('/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    const tables = {
      task: 'tasks',
      forum_post: 'forum_posts',
      donation: 'donations',
      event: 'events'
    };

    if (!tables[type]) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    await pool.query(`DELETE FROM ${tables[type]} WHERE id = $1`, [id]);

    logger.warn(`Content deleted: ${type} ${id} by admin ${req.user.id}`);
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    logger.error('Delete content error:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Award credits to user (manual)
router.post('/credits/award', async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id, amount, reason } = req.body;

    await client.query('BEGIN');

    await client.query(
      'UPDATE users SET time_credits = time_credits + $1 WHERE id = $2',
      [amount, user_id]
    );

    await client.query(
      `INSERT INTO credit_transactions (to_user_id, amount, transaction_type, description)
       VALUES ($1, $2, 'admin_award', $3)`,
      [user_id, amount, reason || 'Admin award']
    );

    await client.query(
      `INSERT INTO notifications (user_id, type, title, message)
       VALUES ($1, 'credits_received', 'Credits Awarded', $2)`,
      [user_id, `You received ${amount} time credits from the admin team!`]
    );

    await client.query('COMMIT');

    logger.info(`Admin ${req.user.id} awarded ${amount} credits to user ${user_id}`);
    res.json({ message: 'Credits awarded successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Award credits error:', error);
    res.status(500).json({ error: 'Failed to award credits' });
  } finally {
    client.release();
  }
});

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const { type = 'combined', lines = 100 } = req.query;

    const logFile = type === 'error' ? 'logs/error.log' : 'logs/combined.log';
    const logPath = path.join(process.cwd(), logFile);

    if (!fs.existsSync(logPath)) {
      return res.status(404).json({ error: 'Log file not found' });
    }

    const data = fs.readFileSync(logPath, 'utf8');
    const logLines = data.split('\n').filter(line => line.trim());
    const recentLogs = logLines.slice(-parseInt(lines));

    res.json({ logs: recentLogs });
  } catch (error) {
    logger.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

module.exports = router;
