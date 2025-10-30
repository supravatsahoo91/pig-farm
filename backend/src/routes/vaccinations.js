const express = require('express');
const pool = require('../database/config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all vaccination schedules
router.get('/schedules', async (req, res) => {
  try {
    // Return predefined vaccine schedules
    const schedules = [
      { id: 'vacc-1', vaccine: 'PRRS', ageWeeks: 2 },
      { id: 'vacc-2', vaccine: 'Porcine Circovirus', ageWeeks: 3 },
      { id: 'vacc-3', vaccine: 'Influenza', ageWeeks: 4 },
      { id: 'vacc-4', vaccine: 'Erysipelothrix', ageWeeks: 8 },
      { id: 'vacc-5', vaccine: 'Pleuropneumonia', ageWeeks: 6 }
    ];

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching vaccination schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccination schedules'
    });
  }
});

// Get pig vaccination history
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
      `SELECT * FROM vaccinations
       WHERE pig_id = $1
       ORDER BY scheduled_date DESC`,
      [pigId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching vaccinations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccinations'
    });
  }
});

// Record vaccination
router.post('/', async (req, res) => {
  try {
    const { pigId, vaccineType, scheduledDate, administeredDate, administringPerson, batchLotNumber, notes } = req.body;

    // Validation
    if (!pigId || !vaccineType) {
      return res.status(400).json({
        success: false,
        error: 'Pig ID and vaccine type are required'
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

    // Validate dates
    if (scheduledDate && new Date(scheduledDate) < new Date(pig.date_of_birth)) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled date cannot be before pig birth date'
      });
    }

    if (administeredDate && new Date(administeredDate) > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Administered date cannot be in future'
      });
    }

    if (administeredDate && scheduledDate && new Date(administeredDate) < new Date(scheduledDate)) {
      return res.status(400).json({
        success: false,
        error: 'Administered date cannot be before scheduled date'
      });
    }

    // Determine status
    let status = 'pending';
    if (administeredDate) {
      status = 'administered';
    } else if (scheduledDate && new Date(scheduledDate) < new Date()) {
      status = 'overdue';
    }

    const vaccinationId = uuidv4();
    const result = await pool.query(
      `INSERT INTO vaccinations (id, pig_id, vaccine_type, scheduled_date, administered_date, status, administering_person, batch_lot_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [vaccinationId, pigId, vaccineType, scheduledDate, administeredDate, status, administringPerson, batchLotNumber, notes]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording vaccination:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record vaccination'
    });
  }
});

// Update vaccination record
router.patch('/:vaccinationId', async (req, res) => {
  try {
    const { vaccinationId } = req.params;
    const { administeredDate, status, administringPerson, notes } = req.body;

    const vaccinationResult = await pool.query(
      'SELECT * FROM vaccinations WHERE id = $1',
      [vaccinationId]
    );

    if (vaccinationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vaccination record not found'
      });
    }

    const vaccination = vaccinationResult.rows[0];

    // Validate administered date
    if (administeredDate && new Date(administeredDate) > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Administered date cannot be in future'
      });
    }

    const result = await pool.query(
      `UPDATE vaccinations
       SET administered_date = COALESCE($1, administered_date),
           status = COALESCE($2, status),
           administering_person = COALESCE($3, administering_person),
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [administeredDate, status, administringPerson, notes, vaccinationId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating vaccination:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update vaccination'
    });
  }
});

// Get overdue vaccines report
router.get('/report/overdue', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, p.rfid_id, p.manual_id, p.current_weight
       FROM vaccinations v
       JOIN pigs p ON v.pig_id = p.id
       WHERE v.status = 'overdue' AND p.status = 'active'
       ORDER BY v.scheduled_date ASC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching overdue vaccines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue vaccines'
    });
  }
});

module.exports = router;
