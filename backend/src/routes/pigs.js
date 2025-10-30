const express = require('express');
const pool = require('../database/config');
const { v4: uuidv4 } = require('uuid');
const rbacMiddleware = require('../middleware/rbac');

const router = express.Router();

// List all pigs with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, status, breed, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM pigs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (breed) {
      query += ` AND breed_type = $${paramCount}`;
      params.push(breed);
      paramCount++;
    }

    if (search) {
      query += ` AND (rfid_id ILIKE $${paramCount} OR manual_id ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM pigs WHERE 1=1 ${status ? ` AND status = $1` : ''} ${breed ? ` AND breed_type = $${status ? 2 : 1}` : ''} ${search ? ` AND (rfid_id ILIKE $${status && breed ? 3 : status || breed ? 2 : 1} OR manual_id ILIKE $${status && breed ? 3 : status || breed ? 2 : 1})` : ''}`,
      params
    );

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Error fetching pigs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pigs'
    });
  }
});

// Get single pig by RFID
router.get('/:rfidId', async (req, res) => {
  try {
    const { rfidId } = req.params;

    const result = await pool.query(
      'SELECT * FROM pigs WHERE rfid_id = $1',
      [rfidId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching pig:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pig'
    });
  }
});

// Get genealogy (4 generations)
router.get('/:rfidId/genealogy', async (req, res) => {
  try {
    const { rfidId } = req.params;

    // Get the pig
    const pigResult = await pool.query(
      'SELECT * FROM pigs WHERE rfid_id = $1',
      [rfidId]
    );

    if (pigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    const pig = pigResult.rows[0];

    // Get ancestors (parents, grandparents, great-grandparents)
    const ancestorsQuery = `
      WITH RECURSIVE ancestors AS (
        SELECT br.parent_pig_id, br.relationship_type, 1 as generation
        FROM breeding_relationships br
        WHERE br.child_pig_id = $1

        UNION

        SELECT br.parent_pig_id, br.relationship_type, a.generation + 1
        FROM breeding_relationships br
        JOIN ancestors a ON br.child_pig_id = a.parent_pig_id
        WHERE a.generation < 3
      )
      SELECT p.*, a.relationship_type, a.generation
      FROM ancestors a
      JOIN pigs p ON a.parent_pig_id = p.id
      ORDER BY a.generation, a.relationship_type
    `;

    const ancestorsResult = await pool.query(ancestorsQuery, [pig.id]);

    // Get offspring
    const offspringQuery = `
      SELECT p.*, br.relationship_type
      FROM breeding_relationships br
      JOIN pigs p ON br.child_pig_id = p.id
      WHERE br.parent_pig_id = $1
    `;

    const offspringResult = await pool.query(offspringQuery, [pig.id]);

    res.json({
      success: true,
      data: {
        pig,
        ancestors: ancestorsResult.rows,
        offspring: offspringResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching genealogy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch genealogy'
    });
  }
});

// Create new pig
router.post('/', rbacMiddleware(['admin']), async (req, res) => {
  try {
    const { rfidId, manualId, dateOfBirth, gender, status, breed, notes } = req.body;

    // Validation
    if (!rfidId || !manualId || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        error: 'RFID, manual ID, date of birth, and gender are required'
      });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'Gender must be male or female'
      });
    }

    // Check for future date of birth
    if (new Date(dateOfBirth) > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Date of birth cannot be in the future'
      });
    }

    // Check for duplicate RFID
    const rfidCheck = await pool.query('SELECT * FROM pigs WHERE rfid_id = $1', [rfidId]);
    if (rfidCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'RFID ID already in use'
      });
    }

    // Check for duplicate manual ID
    const manualCheck = await pool.query('SELECT * FROM pigs WHERE manual_id = $1', [manualId]);
    if (manualCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Manual ID already in use'
      });
    }

    const pigId = uuidv4();
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `INSERT INTO pigs (id, rfid_id, manual_id, date_of_birth, gender, status, breed_type, date_added_to_farm, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [pigId, rfidId, manualId, dateOfBirth, gender, status || 'active', breed, today, notes]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating pig:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pig'
    });
  }
});

// Update pig
router.patch('/:rfidId', rbacMiddleware(['admin']), async (req, res) => {
  try {
    const { rfidId } = req.params;
    const { currentWeight, status, notes } = req.body;

    // Get pig
    const pigResult = await pool.query('SELECT * FROM pigs WHERE rfid_id = $1', [rfidId]);
    if (pigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    const pig = pigResult.rows[0];

    // Update pig
    const result = await pool.query(
      `UPDATE pigs
       SET current_weight = COALESCE($1, current_weight),
           status = COALESCE($2, status),
           notes = COALESCE($3, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE rfid_id = $4
       RETURNING *`,
      [currentWeight, status, notes, rfidId]
    );

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating pig:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pig'
    });
  }
});

// Soft delete pig
router.delete('/:rfidId', rbacMiddleware(['admin']), async (req, res) => {
  try {
    const { rfidId } = req.params;

    const pigResult = await pool.query('SELECT * FROM pigs WHERE rfid_id = $1', [rfidId]);
    if (pigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    await pool.query(
      'UPDATE pigs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE rfid_id = $2',
      ['deceased', rfidId]
    );

    res.json({
      success: true,
      message: 'Pig marked as deceased'
    });
  } catch (error) {
    console.error('Error deleting pig:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pig'
    });
  }
});

module.exports = router;
