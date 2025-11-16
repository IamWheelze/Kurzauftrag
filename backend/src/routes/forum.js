const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get all forum posts
router.get('/posts', async (req, res) => {
  try {
    const { category, post_type, search } = req.query;
    let query = `
      SELECT fp.*, u.name as author_name, u.profile_picture as author_picture,
             u.reputation_score as author_reputation
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.id
      WHERE fp.status = 'active'
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND fp.category = $${params.length}`;
    }

    if (post_type) {
      params.push(post_type);
      query += ` AND fp.post_type = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (fp.title ILIKE $${params.length} OR fp.content ILIKE $${params.length})`;
    }

    query += ' ORDER BY fp.is_pinned DESC, fp.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ posts: result.rows });
  } catch (error) {
    logger.error('Get forum posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Get single post with comments
router.get('/posts/:postId', async (req, res) => {
  try {
    // Increment view count
    await pool.query(
      'UPDATE forum_posts SET view_count = view_count + 1 WHERE id = $1',
      [req.params.postId]
    );

    // Get post
    const postResult = await pool.query(
      `SELECT fp.*, u.name as author_name, u.profile_picture as author_picture
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.id
       WHERE fp.id = $1`,
      [req.params.postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get comments
    const commentsResult = await pool.query(
      `SELECT fc.*, u.name as author_name, u.profile_picture as author_picture
       FROM forum_comments fc
       JOIN users u ON fc.user_id = u.id
       WHERE fc.post_id = $1
       ORDER BY fc.created_at ASC`,
      [req.params.postId]
    );

    res.json({
      post: postResult.rows[0],
      comments: commentsResult.rows
    });
  } catch (error) {
    logger.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to get post' });
  }
});

// Create forum post
router.post('/posts', async (req, res) => {
  try {
    const { category, title, content, post_type, tags } = req.body;

    const result = await pool.query(
      `INSERT INTO forum_posts (user_id, category, title, content, post_type, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, category, title, content, post_type || 'general', tags || []]
    );

    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Add comment
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { content, parent_comment_id } = req.body;

    const result = await pool.query(
      `INSERT INTO forum_comments (post_id, user_id, content, parent_comment_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.postId, req.user.id, content, parent_comment_id]
    );

    // Update comment count
    await pool.query(
      'UPDATE forum_posts SET comments_count = comments_count + 1 WHERE id = $1',
      [req.params.postId]
    );

    res.status(201).json({ comment: result.rows[0] });
  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Like post
router.post('/posts/:postId/like', async (req, res) => {
  try {
    await pool.query(
      'UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id = $1',
      [req.params.postId]
    );

    res.json({ message: 'Post liked' });
  } catch (error) {
    logger.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

module.exports = router;
