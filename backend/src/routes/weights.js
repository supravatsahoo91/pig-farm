const express = require('express');
const pool = require('../database/config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get weight history for pig
router.get('/:pigId/history', async (req, res) => {
  try {
    const { pigId } = req.params;

    // Check pig exists
    const pigResult = await pool.query('SELECT * FROM pigs WHERE id = $1', [pigId]);
    if (pigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    const result = await pool.query(
      `SELECT * FROM weight_records
       WHERE pig_id = $1
       ORDER BY recorded_date DESC`,
      [pigId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching weight history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weight history'
    });
  }
});

// Get weight trend data for pig
router.get('/:pigId/trend', async (req, res) => {
  try {
    const { pigId } = req.params;

    // Check pig exists
    const pigResult = await pool.query('SELECT * FROM pigs WHERE id = $1', [pigId]);
    if (pigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    const result = await pool.query(
      `SELECT
        recorded_date,
        weight_kg,
        CASE
          WHEN LAG(weight_kg) OVER (ORDER BY recorded_date) IS NULL THEN NULL
          ELSE weight_kg - LAG(weight_kg) OVER (ORDER BY recorded_date)
        END as weight_change
       FROM weight_records
       WHERE pig_id = $1
       ORDER BY recorded_date ASC`,
      [pigId]
    );

    const weights = result.rows;
    const avgWeight = weights.length > 0
      ? weights.reduce((sum, w) => sum + parseFloat(w.weight_kg), 0) / weights.length
      : 0;

    const growthRate = weights.length > 1
      ? (parseFloat(weights[weights.length - 1].weight_kg) - parseFloat(weights[0].weight_kg)) / (weights.length - 1)
      : 0;

    res.json({
      success: true,
      data: {
        records: weights,
        avgWeight: parseFloat(avgWeight.toFixed(2)),
        growthRate: parseFloat(growthRate.toFixed(2)),
        totalRecords: weights.length
      }
    });
  } catch (error) {
    console.error('Error fetching weight trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weight trend'
    });
  }
});

// Record single weight entry
router.post('/', async (req, res) => {
  try {
    const { pigId, weight, recordedDate, recordedBy, notes } = req.body;

    // Validation
    if (!pigId || !weight || !recordedDate) {
      return res.status(400).json({
        success: false,
        error: 'Pig ID, weight, and recorded date are required'
      });
    }

    if (weight <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Weight must be positive'
      });
    }

    // Check pig exists
    const pigResult = await pool.query('SELECT * FROM pigs WHERE id = $1', [pigId]);
    if (pigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    const pig = pigResult.rows[0];

    // Cannot record weight for sold or deceased pigs
    if (['sold', 'deceased'].includes(pig.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot record weight for ${pig.status} pigs`
      });
    }

    // Validate recorded date
    if (new Date(recordedDate) > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Recorded date cannot be in future'
      });
    }

    const weightId = uuidv4();
    const result = await pool.query(
      `INSERT INTO weight_records (id, pig_id, weight_kg, recorded_date, recorded_by, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [weightId, pigId, weight, recordedDate, recordedBy, notes]
    );

    // Update pig current weight
    await pool.query(
      'UPDATE pigs SET current_weight = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [weight, pigId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording weight:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record weight'
    });
  }
});

// Bulk record weights
router.post('/bulk', async (req, res) => {
  try {
    const { weights } = req.body;

    // Validation
    if (!Array.isArray(weights) || weights.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Weights must be a non-empty array'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < weights.length; i++) {
      const { pigId, weight, recordedDate, recordedBy, notes } = weights[i];

      try {
        // Validation
        if (!pigId || !weight || !recordedDate) {
          errors.push({ index: i, error: 'Pig ID, weight, and recorded date are required' });
          continue;
        }

        if (weight <= 0) {
          errors.push({ index: i, error: 'Weight must be positive' });
          continue;
        }

        // Check pig exists
        const pigResult = await pool.query('SELECT * FROM pigs WHERE id = $1', [pigId]);
        if (pigResult.rows.length === 0) {
          errors.push({ index: i, error: 'Pig not found' });
          continue;
        }

        const pig = pigResult.rows[0];

        // Cannot record weight for sold or deceased pigs
        if (['sold', 'deceased'].includes(pig.status)) {
          errors.push({ index: i, error: `Cannot record weight for ${pig.status} pigs` });
          continue;
        }

        // Validate recorded date
        if (new Date(recordedDate) > new Date()) {
          errors.push({ index: i, error: 'Recorded date cannot be in future' });
          continue;
        }

        const weightId = uuidv4();
        const result = await pool.query(
          `INSERT INTO weight_records (id, pig_id, weight_kg, recorded_date, recorded_by, notes)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [weightId, pigId, weight, recordedDate, recordedBy, notes]
        );

        // Update pig current weight
        await pool.query(
          'UPDATE pigs SET current_weight = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [weight, pigId]
        );

        results.push(result.rows[0]);
      } catch (itemError) {
        errors.push({ index: i, error: itemError.message });
      }
    }

    res.status(201).json({
      success: errors.length === 0,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk recording weights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk record weights'
    });
  }
});

module.exports = router;
