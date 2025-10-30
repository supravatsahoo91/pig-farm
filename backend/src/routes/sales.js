const express = require('express');
const pool = require('../database/config');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Record sale
router.post('/', async (req, res) => {
  try {
    const { pigId, saleDate, salePrice, buyerName, quantity = 1, saleNotes } = req.body;

    // Validation
    if (!pigId || !saleDate || !salePrice) {
      return res.status(400).json({
        success: false,
        error: 'Pig ID, sale date, and sale price are required'
      });
    }

    if (salePrice <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Sale price must be positive'
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

    // Pig must be active
    if (pig.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only sell active pigs'
      });
    }

    // Validate sale date
    if (new Date(saleDate) > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Sale date cannot be in future'
      });
    }

    if (new Date(saleDate) < new Date(pig.date_of_birth)) {
      return res.status(400).json({
        success: false,
        error: 'Sale date cannot be before pig birth date'
      });
    }

    const saleId = uuidv4();
    const result = await pool.query(
      `INSERT INTO sales_records (id, pig_id, sale_date, sale_price, buyer_name, quantity, sale_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [saleId, pigId, saleDate, salePrice, buyerName, quantity, saleNotes]
    );

    // Update pig status to sold
    await pool.query(
      'UPDATE pigs SET status = $1, date_sold = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['sold', saleDate, pigId]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error recording sale:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record sale'
    });
  }
});

// Get sales history
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, buyerName } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT sr.*, p.rfid_id, p.manual_id, p.breed_type
      FROM sales_records sr
      JOIN pigs p ON sr.pig_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND sr.sale_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND sr.sale_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    if (buyerName) {
      query += ` AND sr.buyer_name ILIKE $${paramCount}`;
      params.push(`%${buyerName}%`);
      paramCount++;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM sales_records sr
       JOIN pigs p ON sr.pig_id = p.id
       WHERE 1=1 ${startDate ? ' AND sr.sale_date >= $1' : ''} ${endDate ? ' AND sr.sale_date <= $' + (startDate ? 2 : 1) : ''} ${buyerName ? ' AND sr.buyer_name ILIKE $' + (startDate && endDate ? 3 : startDate || endDate ? 2 : 1) : ''}`,
      params
    );

    query += ` ORDER BY sr.sale_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
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
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales'
    });
  }
});

// Get sales report
router.get('/report/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        COUNT(*) as total_sales,
        SUM(sale_price * quantity) as total_revenue,
        AVG(sale_price) as avg_price,
        MIN(sale_price) as min_price,
        MAX(sale_price) as max_price,
        COUNT(DISTINCT buyer_name) as unique_buyers
      FROM sales_records
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND sale_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND sale_date <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales report'
    });
  }
});

module.exports = router;
