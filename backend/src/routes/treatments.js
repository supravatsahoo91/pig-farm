const express = require('express');
const pool = require('../database/config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get treatment history for pig
router.get('/:pigId', async (req, res) => {
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
      `SELECT * FROM medical_treatments
       WHERE pig_id = $1
       ORDER BY treatment_date DESC`,
      [pigId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching treatment history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch treatment history'
    });
  }
});

// Record treatment
router.post('/', async (req, res) => {
  try {
    const { pigId, medicationName, dosage, dosageUnit, treatmentDate, endDate, frequency, reasonForTreatment, administeringPerson, notes } = req.body;

    // Validation
    if (!pigId || !medicationName || !dosage || !treatmentDate || !frequency) {
      return res.status(400).json({
        success: false,
        error: 'Pig ID, medication name, dosage, treatment date, and frequency are required'
      });
    }

    if (dosage <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Dosage must be positive'
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

    // Validate dates
    if (new Date(treatmentDate) > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Treatment date cannot be in future'
      });
    }

    if (endDate && new Date(endDate) < new Date(treatmentDate)) {
      return res.status(400).json({
        success: false,
        error: 'End date cannot be before treatment start date'
      });
    }

    const treatmentId = uuidv4();
    const result = await pool.query(
      `INSERT INTO medical_treatments (id, pig_id, medication_name, dosage, dosage_unit, treatment_date, end_date, frequency, reason_for_treatment, administering_person, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [treatmentId, pigId, medicationName, dosage, dosageUnit, treatmentDate, endDate, frequency, reasonForTreatment, administeringPerson, notes]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording treatment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record treatment'
    });
  }
});

// Update treatment
router.patch('/:treatmentId', async (req, res) => {
  try {
    const { treatmentId } = req.params;
    const { endDate, frequency, notes } = req.body;

    const treatmentResult = await pool.query(
      'SELECT * FROM medical_treatments WHERE id = $1',
      [treatmentId]
    );

    if (treatmentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Treatment record not found'
      });
    }

    const treatment = treatmentResult.rows[0];

    // Validate endDate
    if (endDate && new Date(endDate) < new Date(treatment.treatment_date)) {
      return res.status(400).json({
        success: false,
        error: 'End date cannot be before treatment start date'
      });
    }

    const result = await pool.query(
      `UPDATE medical_treatments
       SET end_date = COALESCE($1, end_date),
           frequency = COALESCE($2, frequency),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [endDate, frequency, notes, treatmentId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating treatment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update treatment'
    });
  }
});

// Get active treatments
router.get('/report/active', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mt.*, p.rfid_id, p.manual_id
       FROM medical_treatments mt
       JOIN pigs p ON mt.pig_id = p.id
       WHERE mt.end_date IS NULL OR mt.end_date >= CURRENT_DATE
       AND p.status = 'active'
       ORDER BY mt.treatment_date DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching active treatments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active treatments'
    });
  }
});

module.exports = router;
