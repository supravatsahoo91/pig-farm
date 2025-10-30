import React, { useState, useEffect } from 'react';
import { treatmentAPI, pigsAPI } from '../services/api';
import '../styles/Pages.css';

function TreatmentManagement() {
  const [treatments, setTreatments] = useState([]);
  const [pigs, setPigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    pigId: '', medicationName: '', dosage: '', dosageUnit: 'mg',
    treatmentDate: '', endDate: '', frequency: '', reasonForTreatment: '', administeringPerson: '', notes: ''
  });

  useEffect(() => {
    fetchActive();
    fetchPigs();
  }, []);

  const fetchActive = async () => {
    try {
      const result = await treatmentAPI.getActive();
      setTreatments(result.data.data);
    } catch (err) {
      setError('Failed to fetch treatments');
    }
  };

  const fetchPigs = async () => {
    try {
      const result = await pigsAPI.getAll(1, 100);
      setPigs(result.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await treatmentAPI.recordTreatment(formData);
      setFormData({
        pigId: '', medicationName: '', dosage: '', dosageUnit: 'mg',
        treatmentDate: '', endDate: '', frequency: '', reasonForTreatment: '', administeringPerson: '', notes: ''
      });
      setShowForm(false);
      await fetchActive();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record treatment');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Medical Treatment Management</h1>
        <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Treatment'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header"><h3>Record Treatment</h3></div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Pig *</label>
                <select value={formData.pigId} onChange={(e) => setFormData({ ...formData, pigId: e.target.value })} required>
                  <option value="">Select a pig</option>
                  {pigs.map((pig) => (
                    <option key={pig.id} value={pig.id}>{pig.manual_id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Medication *</label>
                <input type="text" value={formData.medicationName} onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Dosage *</label>
                <input type="number" value={formData.dosage} onChange={(e) => setFormData({ ...formData, dosage: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select value={formData.dosageUnit} onChange={(e) => setFormData({ ...formData, dosageUnit: e.target.value })}>
                  <option value="mg">mg</option>
                  <option value="ml">ml</option>
                  <option value="units">units</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Treatment Date *</label>
                <input type="date" value={formData.treatmentDate} onChange={(e) => setFormData({ ...formData, treatmentDate: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Frequency *</label>
                <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} required>
                  <option value="">Select frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="as-needed">As Needed</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Record Treatment</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Active Treatments ({treatments.length})</h3>
        {treatments.length === 0 ? (
          <p>No active treatments</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Pig</th>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Start Date</th>
              </tr>
            </thead>
            <tbody>
              {treatments.map((t) => (
                <tr key={t.id}>
                  <td>{t.manual_id}</td>
                  <td>{t.medication_name}</td>
                  <td>{t.dosage} {t.dosage_unit}</td>
                  <td>{t.frequency}</td>
                  <td>{new Date(t.treatment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TreatmentManagement;
