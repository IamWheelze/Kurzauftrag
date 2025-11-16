const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get all tasks (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, category, city, task_type } = req.query;
    let query = `
      SELECT t.*, u.name as creator_name, u.profile_picture as creator_picture,
             u.reputation_score as creator_reputation
      FROM tasks t
      JOIN users u ON t.creator_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND t.category = $${params.length}`;
    }

    if (city) {
      params.push(city);
      query += ` AND t.location ILIKE $${params.length}`;
    }

    if (task_type) {
      params.push(task_type);
      query += ` AND t.task_type = $${params.length}`;
    }

    query += ' ORDER BY t.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (error) {
    logger.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get single task
router.get('/:taskId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*,
              u1.name as creator_name, u1.profile_picture as creator_picture,
              u1.reputation_score as creator_reputation,
              u2.name as assignee_name, u2.profile_picture as assignee_picture
       FROM tasks t
       JOIN users u1 ON t.creator_id = u1.id
       LEFT JOIN users u2 ON t.assignee_id = u2.id
       WHERE t.id = $1`,
      [req.params.taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    logger.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Create new task
router.post('/', async (req, res) => {
  try {
    const {
      title, description, category, task_type, location, latitude, longitude,
      scheduled_date, scheduled_time, duration_minutes, payment_type,
      payment_amount, credits_offered, priority
    } = req.body;

    const result = await pool.query(
      `INSERT INTO tasks (
        creator_id, title, description, category, task_type, location,
        latitude, longitude, scheduled_date, scheduled_time, duration_minutes,
        payment_type, payment_amount, credits_offered, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        req.user.id, title, description, category, task_type, location,
        latitude, longitude, scheduled_date, scheduled_time, duration_minutes,
        payment_type, payment_amount, credits_offered, priority || 'normal'
      ]
    );

    // Send notification to nearby users
    const io = req.app.get('io');
    io.emit('new_task', { task: result.rows[0] });

    res.status(201).json({ task: result.rows[0] });
  } catch (error) {
    logger.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Accept/Assign task
router.post('/:taskId/accept', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if task is available
    const taskResult = await client.query(
      'SELECT * FROM tasks WHERE id = $1 AND status = $2',
      [req.params.taskId, 'open']
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not available' });
    }

    const task = taskResult.rows[0];

    // Update task
    const result = await client.query(
      `UPDATE tasks
       SET assignee_id = $1, status = 'assigned'
       WHERE id = $2
       RETURNING *`,
      [req.user.id, req.params.taskId]
    );

    // Create notification for task creator
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, data, action_url)
       VALUES ($1, 'task_accepted', 'Task Accepted', $2, $3, $4)`,
      [
        task.creator_id,
        `${req.user.name} has accepted your task "${task.title}"`,
        JSON.stringify({ task_id: task.id, accepter_id: req.user.id }),
        `/tasks/${task.id}`
      ]
    );

    await client.query('COMMIT');

    // Send real-time notification
    const io = req.app.get('io');
    io.emit(`user_${task.creator_id}`, {
      type: 'task_accepted',
      task: result.rows[0]
    });

    res.json({ task: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Accept task error:', error);
    res.status(500).json({ error: 'Failed to accept task' });
  } finally {
    client.release();
  }
});

// Complete task
router.post('/:taskId/complete', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const taskResult = await client.query(
      'SELECT * FROM tasks WHERE id = $1',
      [req.params.taskId]
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Only creator or assignee can mark complete
    if (task.creator_id !== req.user.id && task.assignee_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update task
    await client.query(
      `UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [req.params.taskId]
    );

    // Transfer credits if applicable
    if (task.payment_type === 'credits' && task.credits_offered && task.assignee_id) {
      // Deduct from creator
      await client.query(
        'UPDATE users SET time_credits = time_credits - $1 WHERE id = $2',
        [task.credits_offered, task.creator_id]
      );

      // Add to assignee
      await client.query(
        'UPDATE users SET time_credits = time_credits + $1 WHERE id = $2',
        [task.credits_offered, task.assignee_id]
      );

      // Record transaction
      await client.query(
        `INSERT INTO credit_transactions (from_user_id, to_user_id, amount, transaction_type, reference_type, reference_id, description)
         VALUES ($1, $2, $3, 'task_payment', 'task', $4, $5)`,
        [task.creator_id, task.assignee_id, task.credits_offered, task.id, task.title]
      );
    }

    // Notify both parties
    if (task.assignee_id) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, action_url)
         VALUES ($1, 'task_completed', 'Task Completed', $2, $3)`,
        [task.assignee_id, `Task "${task.title}" has been marked complete`, `/tasks/${task.id}`]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Task completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  } finally {
    client.release();
  }
});

// Delete task
router.delete('/:taskId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND creator_id = $2 RETURNING *',
      [req.params.taskId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
