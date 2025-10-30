import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../services/api';
import '../styles/Pages.css';

function Reports() {
  const [vaccinationReport, setVaccinationReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [healthReport, setHealthReport] = useState(null);
  const [weightReport, setWeightReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [vacc, sales, health, weight] = await Promise.all([
        reportsAPI.getVaccinationStatus(),
        reportsAPI.getSalesSummary(),
        reportsAPI.getHealthOverview(),
        reportsAPI.getWeightAnalysis()
      ]);
      setVaccinationReport(vacc.data.data);
      setSalesReport(sales.data.data);
      setHealthReport(health.data.data);
      setWeightReport(weight.data.data);
    } catch (err) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content"><div className="loading">Loading reports...</div></div>;

  return (
    <div className="main-content">
      <h1>Reports & Analytics</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {vaccinationReport && (
        <div className="card">
          <h3>Vaccination Status Report</h3>
          <div className="form-row">
            {vaccinationReport.summary?.map((s, i) => (
              <div key={i}>
                <strong>{s.status}</strong>: {s.count} vaccines
              </div>
            ))}
          </div>
        </div>
      )}

      {salesReport && (
        <div className="card">
          <h3>Sales Summary</h3>
          {salesReport.monthlySales?.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Sales Count</th>
                  <th>Total Revenue</th>
                  <th>Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {salesReport.monthlySales.map((s, i) => (
                  <tr key={i}>
                    <td>{new Date(s.month).toLocaleDateString()}</td>
                    <td>{s.sales_count}</td>
                    <td>${s.total_revenue?.toFixed(2)}</td>
                    <td>${s.avg_price?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {healthReport && (
        <div className="card">
          <h3>Health Overview</h3>
          <div className="form-row">
            <div><strong>Active Treatments:</strong> {healthReport.activeTreatments?.active_treatments || 0}</div>
            <div><strong>Overdue Vaccines:</strong> {healthReport.overdueVaccines}</div>
          </div>
        </div>
      )}

      {weightReport && weightReport.length > 0 && (
        <div className="card">
          <h3>Weight Analysis by Breed</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Breed</th>
                <th>Pig Count</th>
                <th>Avg Weight</th>
                <th>Min Weight</th>
                <th>Max Weight</th>
              </tr>
            </thead>
            <tbody>
              {weightReport.map((w, i) => (
                <tr key={i}>
                  <td>{w.breed_type || 'Unknown'}</td>
                  <td>{w.pig_count}</td>
                  <td>{w.avg_weight?.toFixed(1)} kg</td>
                  <td>{w.min_weight?.toFixed(1)} kg</td>
                  <td>{w.max_weight?.toFixed(1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reports;
