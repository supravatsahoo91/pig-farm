import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pigsAPI, reportsAPI, vaccinationAPI, salesAPI } from '../services/api';
import '../styles/Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalPigs: 0,
    vaccinesOverdue: 0,
    recentSales: 0,
    activeTreatments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const pigsResult = await pigsAPI.getAll(1, 1);
      const vaccResult = await vaccinationAPI.getOverdue();
      const reportsResult = await reportsAPI.getHealthOverview();
      const salesResult = await salesAPI.getAll(1, 100);

      const totalOverdue = vaccResult.data.data.length;
      const recentSalesCount = salesResult.data.data.slice(0, 10).length;
      const activeTreatments = reportsResult.data.data.activeTreatments.active_treatments || 0;

      setStats({
        totalPigs: pigsResult.data.pagination.total,
        vaccinesOverdue: totalOverdue,
        recentSales: recentSalesCount,
        activeTreatments: activeTreatments,
      });

      setError('');
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="main-content"><div className="loading">Loading dashboard...</div></div>;
  }

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to Pig Farm Management System</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-container">
        <div className="stat-card">
          <h4>Total Active Pigs</h4>
          <div className="value">{stats.totalPigs}</div>
          <Link to="/pigs" className="stat-link">View all pigs →</Link>
        </div>

        <div className="stat-card">
          <h4>Vaccines Overdue</h4>
          <div className="value" style={{ color: stats.vaccinesOverdue > 0 ? '#e74c3c' : '#27ae60' }}>
            {stats.vaccinesOverdue}
          </div>
          <Link to="/vaccinations" className="stat-link">Manage vaccinations →</Link>
        </div>

        <div className="stat-card">
          <h4>Active Treatments</h4>
          <div className="value">{stats.activeTreatments}</div>
          <Link to="/treatments" className="stat-link">View treatments →</Link>
        </div>

        <div className="stat-card">
          <h4>Recent Sales</h4>
          <div className="value">{stats.recentSales}</div>
          <Link to="/sales" className="stat-link">View sales →</Link>
        </div>
      </div>

      <div className="dashboard-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/pigs" className="action-btn btn-primary">
            + Add New Pig
          </Link>
          <Link to="/vaccinations" className="action-btn btn-primary">
            Record Vaccination
          </Link>
          <Link to="/weights" className="action-btn btn-primary">
            Record Weight
          </Link>
          <Link to="/treatments" className="action-btn btn-primary">
            Add Treatment
          </Link>
          <Link to="/sales" className="action-btn btn-primary">
            Record Sale
          </Link>
          <Link to="/reports" className="action-btn btn-primary">
            View Reports
          </Link>
        </div>
      </div>

      <div className="dashboard-info">
        <h2>System Information</h2>
        <div className="info-card">
          <h3>Features</h3>
          <ul>
            <li>✓ Track pigs with RFID identifiers</li>
            <li>✓ Manage 4-generation genealogy</li>
            <li>✓ Vaccination schedule and tracking</li>
            <li>✓ Medical treatment history</li>
            <li>✓ Weight monitoring and trends</li>
            <li>✓ Sales management and reports</li>
            <li>✓ Role-based access control</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
