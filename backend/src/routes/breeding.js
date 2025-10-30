const express = require('express');
const pool = require('../database/config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Record breeding event
router.post('/', async (req, res) => {
  try {
    const { childPigId, parentPigId, relationshipType, breedingDate, notes } = req.body;

    // Validation
    if (!childPigId || !parentPigId || !relationshipType || !breedingDate) {
      return res.status(400).json({
        success: false,
        error: 'Child pig ID, parent pig ID, relationship type, and breeding date are required'
      });
    }

    if (!['mother', 'father'].includes(relationshipType)) {
      return res.status(400).json({
        success: false,
        error: 'Relationship type must be mother or father'
      });
    }

    // Check if pigs exist
    const childPigResult = await pool.query('SELECT * FROM pigs WHERE id = $1', [childPigId]);
    if (childPigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child pig not found'
      });
    }

    const parentPigResult = await pool.query('SELECT * FROM pigs WHERE id = $1', [parentPigId]);
    if (parentPigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parent pig not found'
      });
    }

    const childPig = childPigResult.rows[0];
    const parentPig = parentPigResult.rows[0];

    // Cannot breed pig with itself
    if (childPigId === parentPigId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot breed pig with itself'
      });
    }

    // Breeding date cannot be before child's birth date
    if (new Date(breedingDate) < new Date(childPig.date_of_birth)) {
      return res.status(400).json({
        success: false,
        error: 'Breeding date cannot be before child pig birth date'
      });
    }

    // Check for incestuous breeding (offspring with ancestor)
    const incestCheck = await pool.query(
      `WITH RECURSIVE ancestors AS (
        SELECT parent_pig_id, child_pig_id
        FROM breeding_relationships
        WHERE child_pig_id = $1

        UNION

        SELECT br.parent_pig_id, br.child_pig_id
        FROM breeding_relationships br
        JOIN ancestors a ON br.child_pig_id = a.parent_pig_id
      )
      SELECT COUNT(*) as count FROM ancestors WHERE parent_pig_id = $2`,
      [childPigId, parentPigId]
    );

    if (parseInt(incestCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot breed offspring with ancestor (genetic issue prevention)'
      });
    }

    // Check gender compatibility
    if (relationshipType === 'mother' && parentPig.gender !== 'female') {
      return res.status(400).json({
        success: false,
        error: 'Mother must be female'
      });
    }

    if (relationshipType === 'father' && parentPig.gender !== 'male') {
      return res.status(400).json({
        success: false,
        error: 'Father must be male'
      });
    }

    const relationshipId = uuidv4();
    const result = await pool.query(
      `INSERT INTO breeding_relationships (id, child_pig_id, parent_pig_id, relationship_type, breeding_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [relationshipId, childPigId, parentPigId, relationshipType, breedingDate, notes]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording breeding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record breeding'
    });
  }
});

// Get breeding history for pig
router.get('/:pigId', async (req, res) => {
  try {
    const { pigId } = req.params;

    // Get pig
    const pigResult = await pool.query('SELECT * FROM pigs WHERE id = $1', [pigId]);
    if (pigResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pig not found'
      });
    }

    // Get breeding relationships where this pig is a parent
    const asParentResult = await pool.query(
      `SELECT br.*, p.rfid_id, p.manual_id, p.gender
       FROM breeding_relationships br
       JOIN pigs p ON br.child_pig_id = p.id
       WHERE br.parent_pig_id = $1
       ORDER BY br.breeding_date DESC`,
      [pigId]
    );

    // Get breeding relationships where this pig is a child
    const asChildResult = await pool.query(
      `SELECT br.*, p.rfid_id, p.manual_id, p.gender
       FROM breeding_relationships br
       JOIN pigs p ON br.parent_pig_id = p.id
       WHERE br.child_pig_id = $1
       ORDER BY br.breeding_date DESC`,
      [pigId]
    );

    res.json({
      success: true,
      data: {
        asParent: asParentResult.rows,
        asChild: asChildResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching breeding history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch breeding history'
    });
  }
});

// Get offspring for pig
router.get('/:pigId/offspring', async (req, res) => {
  try {
    const { pigId } = req.params;

    const result = await pool.query(
      `SELECT p.*, br.relationship_type, br.breeding_date
       FROM breeding_relationships br
       JOIN pigs p ON br.child_pig_id = p.id
       WHERE br.parent_pig_id = $1
       ORDER BY br.breeding_date DESC`,
      [pigId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching offspring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offspring'
    });
  }
});

// Get ancestors for pig (up to 4 generations)
router.get('/:pigId/ancestors', async (req, res) => {
  try {
    const { pigId } = req.params;

    const result = await pool.query(
      `WITH RECURSIVE ancestors AS (
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
      ORDER BY a.generation, a.relationship_type`,
      [pigId]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching ancestors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ancestors'
    });
  }
});

module.exports = router;
