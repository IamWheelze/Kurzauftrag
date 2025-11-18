const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get conversations
router.get('/conversations', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (other_user_id)
        CASE
          WHEN sender_id = $1 THEN recipient_id
          ELSE sender_id
        END as other_user_id,
        u.name as other_user_name,
        u.profile_picture as other_user_picture,
        m.content as last_message,
        m.created_at as last_message_time,
        COUNT(CASE WHEN recipient_id = $1 AND is_read = false THEN 1 END) as unread_count
      FROM messages m
      JOIN users u ON (
        CASE
          WHEN m.sender_id = $1 THEN m.recipient_id
          ELSE m.sender_id
        END = u.id
      )
      WHERE sender_id = $1 OR recipient_id = $1
      GROUP BY other_user_id, u.name, u.profile_picture, m.content, m.created_at
      ORDER BY other_user_id, m.created_at DESC`,
      [req.user.id]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages with a specific user
router.get('/:userId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*,
              s.name as sender_name, s.profile_picture as sender_picture,
              r.name as recipient_name, r.profile_picture as recipient_picture
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.recipient_id = r.id
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC
       LIMIT 100`,
      [req.user.id, req.params.userId]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE messages
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE recipient_id = $1 AND sender_id = $2 AND is_read = false`,
      [req.user.id, req.params.userId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/', async (req, res) => {
  try {
    const { recipient_id, content, reference_type, reference_id } = req.body;

    if (!content || !recipient_id) {
      return res.status(400).json({ error: 'Content and recipient required' });
    }

    const result = await pool.query(
      `INSERT INTO messages (sender_id, recipient_id, content, reference_type, reference_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, recipient_id, content, reference_type, reference_id]
    );

    // Send notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES ($1, 'new_message', 'New Message', $2, $3)`,
      [recipient_id, `${req.user.name} sent you a message`, `/messages/${req.user.id}`]
    );

    // Emit socket event
    const io = req.app.get('io');
    io.emit(`user_${recipient_id}`, {
      type: 'new_message',
      message: result.rows[0]
    });

    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get unread message count
router.get('/unread/count', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

module.exports = router;
