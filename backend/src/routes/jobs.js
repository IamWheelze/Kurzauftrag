const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../config/logger');

// Get all mini-jobs
router.get('/', async (req, res) => {
  try {
    const { category, status, is_youth_friendly } = req.query;
    let query = `
      SELECT mj.*, u.name as poster_name, u.profile_picture as poster_picture,
             u.reputation_score as poster_reputation
      FROM mini_jobs mj
      JOIN users u ON mj.poster_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND mj.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND mj.category = $${params.length}`;
    }

    if (is_youth_friendly === 'true') {
      query += ' AND mj.is_youth_friendly = true';
    }

    query += ' ORDER BY mj.created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json({ jobs: result.rows });
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

// Create mini-job
router.post('/', async (req, res) => {
  try {
    const {
      title, description, category, age_requirement, skills_required,
      location, payment_type, payment_amount, credits_offered,
      scheduled_date, estimated_hours, is_youth_friendly
    } = req.body;

    const result = await pool.query(
      `INSERT INTO mini_jobs (
        poster_id, title, description, category, age_requirement,
        skills_required, location, payment_type, payment_amount,
        credits_offered, scheduled_date, estimated_hours, is_youth_friendly
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        req.user.id, title, description, category, age_requirement,
        skills_required || [], location, payment_type || 'cash',
        payment_amount, credits_offered, scheduled_date, estimated_hours,
        is_youth_friendly !== false
      ]
    );

    res.status(201).json({ job: result.rows[0] });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Apply for job
router.post('/:jobId/apply', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE mini_jobs
       SET worker_id = $1, status = 'assigned'
       WHERE id = $2 AND status = 'open'
       RETURNING *`,
      [req.user.id, req.params.jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not available' });
    }

    const job = result.rows[0];

    // Notify poster
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, action_url)
       VALUES ($1, 'job_application', 'New Job Application', $2, $3)`,
      [job.poster_id, `${req.user.name} has applied for "${job.title}"`, `/jobs/${job.id}`]
    );

    res.json({ job: result.rows[0] });
  } catch (error) {
    logger.error('Apply for job error:', error);
    res.status(500).json({ error: 'Failed to apply for job' });
  }
});

// Complete job
router.post('/:jobId/complete', async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const jobResult = await client.query(
      'SELECT * FROM mini_jobs WHERE id = $1',
      [req.params.jobId]
    );

    if (jobResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobResult.rows[0];

    await client.query(
      `UPDATE mini_jobs SET status = 'completed' WHERE id = $1`,
      [req.params.jobId]
    );

    // Transfer credits if applicable
    if (job.payment_type === 'credits' && job.credits_offered && job.worker_id) {
      await client.query(
        'UPDATE users SET time_credits = time_credits - $1 WHERE id = $2',
        [job.credits_offered, job.poster_id]
      );

      await client.query(
        'UPDATE users SET time_credits = time_credits + $1 WHERE id = $2',
        [job.credits_offered, job.worker_id]
      );

      await client.query(
        `INSERT INTO credit_transactions (from_user_id, to_user_id, amount, transaction_type, reference_type, reference_id, description)
         VALUES ($1, $2, $3, 'job_payment', 'mini_job', $4, $5)`,
        [job.poster_id, job.worker_id, job.credits_offered, job.id, job.title]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Job completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Complete job error:', error);
    res.status(500).json({ error: 'Failed to complete job' });
  } finally {
    client.release();
  }
});

module.exports = router;
