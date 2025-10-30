import React, { useState, useEffect } from 'react';
import { vaccinationAPI, pigsAPI } from '../services/api';
import '../styles/Pages.css';

function VaccinationManagement() {
  const [vaccinations, setVaccinations] = useState([]);
  const [pigs, setPigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    pigId: '',
    vaccineType: '',
    scheduledDate: '',
    administeredDate: '',
    administringPerson: '',
    notes: ''
  });

  useEffect(() => {
    fetchOverdueVaccines();
    fetchPigs();
  }, []);

  const fetchOverdueVaccines = async () => {
    try {
      const result = await vaccinationAPI.getOverdue();
      setVaccinations(result.data.data);
    } catch (err) {
      setError('Failed to fetch vaccines');
    }
  };

  const fetchPigs = async () => {
    try {
      const result = await pigsAPI.getAll(1, 100);
      setPigs(result.data.data);
    } catch (err) {
      console.error('Failed to fetch pigs', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await vaccinationAPI.recordVaccination(formData);
      setFormData({
        pigId: '',
        vaccineType: '',
        scheduledDate: '',
        administeredDate: '',
        administringPerson: '',
        notes: ''
      });
      setShowForm(false);
      await fetchOverdueVaccines();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record vaccination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Vaccination Management</h1>
        <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Record Vaccination'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3>Record Vaccination</h3>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Pig *</label>
                <select
                  value={formData.pigId}
                  onChange={(e) => setFormData({ ...formData, pigId: e.target.value })}
                  required
                >
                  <option value="">Select a pig</option>
                  {pigs.map((pig) => (
                    <option key={pig.id} value={pig.id}>
                      {pig.manual_id} - {pig.rfid_id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Vaccine Type *</label>
                <input
                  type="text"
                  value={formData.vaccineType}
                  onChange={(e) => setFormData({ ...formData, vaccineType: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Scheduled Date</label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Administered Date</label>
                <input
                  type="date"
                  value={formData.administeredDate}
                  onChange={(e) => setFormData({ ...formData, administeredDate: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Administering Person</label>
              <input
                type="text"
                value={formData.administringPerson}
                onChange={(e) => setFormData({ ...formData, administringPerson: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Record Vaccination
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Overdue Vaccinations ({vaccinations.length})</h3>
        {vaccinations.length === 0 ? (
          <p>No overdue vaccinations</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Pig ID</th>
                <th>Vaccine</th>
                <th>Scheduled Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vaccinations.map((v) => (
                <tr key={v.id}>
                  <td>{v.manual_id}</td>
                  <td>{v.vaccine_type}</td>
                  <td>{new Date(v.scheduled_date).toLocaleDateString()}</td>
                  <td>{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default VaccinationManagement;
