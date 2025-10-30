const express = require('express');
const pool = require('../database/config');

const router = express.Router();

// Vaccination status report
router.get('/vaccination-status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        v.status,
        COUNT(*) as count,
        ARRAY_AGG(DISTINCT v.vaccine_type) as vaccine_types
      FROM vaccinations v
      JOIN pigs p ON v.pig_id = p.id
      WHERE p.status = 'active'
      GROUP BY v.status
      ORDER BY v.status
    `);

    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM pigs WHERE status = $1',
      ['active']
    );

    const detailResult = await pool.query(`
      SELECT v.*, p.rfid_id, p.manual_id, p.breed_type
      FROM vaccinations v
      JOIN pigs p ON v.pig_id = p.id
      WHERE p.status = 'active'
      ORDER BY v.status, v.scheduled_date DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: {
        summary: result.rows,
        totalActivePigs: parseInt(totalResult.rows[0].total),
        details: detailResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching vaccination status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vaccination status'
    });
  }
});

// Genealogy report
router.get('/genealogy', async (req, res) => {
  try {
    const { generation } = req.query;

    let query = `
      SELECT
        p.id,
        p.rfid_id,
        p.manual_id,
        p.gender,
        p.breed_type,
        p.date_of_birth,
        p.status,
        COUNT(br.child_pig_id) as offspring_count,
        (SELECT COUNT(*) FROM breeding_relationships WHERE parent_pig_id = p.id) as total_offspring
      FROM pigs p
      LEFT JOIN breeding_relationships br ON p.id = br.parent_pig_id
      GROUP BY p.id, p.rfid_id, p.manual_id, p.gender, p.breed_type, p.date_of_birth, p.status
      ORDER BY p.date_of_birth DESC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching genealogy report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch genealogy report'
    });
  }
});

// Sales summary report
router.get('/sales-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate) {
      dateFilter += ' AND sr.sale_date >= $1';
      params.push(startDate);
    }

    if (endDate) {
      dateFilter += ` AND sr.sale_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    const summaryResult = await pool.query(`
      SELECT
        DATE_TRUNC('month', sr.sale_date)::DATE as month,
        COUNT(*) as sales_count,
        SUM(sr.sale_price * sr.quantity) as total_revenue,
        AVG(sr.sale_price) as avg_price,
        SUM(sr.quantity) as total_quantity_sold
      FROM sales_records sr
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE_TRUNC('month', sr.sale_date)
      ORDER BY month DESC
    `, params);

    const topBuyersResult = await pool.query(`
      SELECT
        sr.buyer_name,
        COUNT(*) as purchases,
        SUM(sr.sale_price * sr.quantity) as total_spent,
        AVG(sr.sale_price) as avg_price
      FROM sales_records sr
      WHERE 1=1 ${dateFilter}
      GROUP BY sr.buyer_name
      ORDER BY total_spent DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      data: {
        monthlySales: summaryResult.rows,
        topBuyers: topBuyersResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales summary'
    });
  }
});

// Health overview report
router.get('/health-overview', async (req, res) => {
  try {
    // Active treatments
    const treatmentsResult = await pool.query(`
      SELECT
        COUNT(*) as active_treatments,
        ARRAY_AGG(DISTINCT mt.medication_name) as medications
      FROM medical_treatments mt
      WHERE mt.end_date IS NULL OR mt.end_date >= CURRENT_DATE
    `);

    // Overdue vaccines
    const overdueResult = await pool.query(`
      SELECT COUNT(*) as overdue_count
      FROM vaccinations
      WHERE status = 'overdue'
    `);

    // Health status by breed
    const breedHealthResult = await pool.query(`
      SELECT
        p.breed_type,
        COUNT(*) as total_pigs,
        COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN p.status = 'sold' THEN 1 END) as sold,
        COUNT(CASE WHEN p.status = 'deceased' THEN 1 END) as deceased,
        AVG(p.current_weight) as avg_weight
      FROM pigs p
      GROUP BY p.breed_type
    `);

    res.json({
      success: true,
      data: {
        activeTreatments: treatmentsResult.rows[0],
        overdueVaccines: parseInt(overdueResult.rows[0].overdue_count),
        breedHealth: breedHealthResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching health overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health overview'
    });
  }
});

// Weight analysis report
router.get('/weight-analysis', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.breed_type,
        COUNT(DISTINCT p.id) as pig_count,
        AVG(p.current_weight) as avg_weight,
        MIN(p.current_weight) as min_weight,
        MAX(p.current_weight) as max_weight,
        STDDEV(p.current_weight) as weight_stddev
      FROM pigs p
      WHERE p.status = 'active'
      GROUP BY p.breed_type
      ORDER BY avg_weight DESC
    `);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching weight analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weight analysis'
    });
  }
});

module.exports = router;
