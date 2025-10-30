import React, { useState, useEffect } from 'react';
import { weightAPI, pigsAPI } from '../services/api';
import '../styles/Pages.css';

function WeightTracking() {
  const [pigs, setPigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    pigId: '', weight: '', recordedDate: '', recordedBy: '', notes: ''
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkData, setBulkData] = useState('');

  useEffect(() => {
    fetchPigs();
  }, []);

  const fetchPigs = async () => {
    try {
      const result = await pigsAPI.getAll(1, 100);
      setPigs(result.data.data.filter(p => p.status === 'active'));
    } catch (err) {
      setError('Failed to fetch pigs');
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    try {
      await weightAPI.recordWeight(formData);
      setFormData({ pigId: '', weight: '', recordedDate: '', recordedBy: '', notes: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record weight');
    }
  };

  const handleBulkSubmit = async () => {
    try {
      const weights = JSON.parse(bulkData);
      await weightAPI.bulkRecordWeights(weights);
      setBulkData('');
      setShowForm(false);
    } catch (err) {
      setError('Invalid JSON or submission failed');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Weight Tracking</h1>
        <button className="btn btn-success" onClick={() => { setShowForm(!showForm); setBulkMode(false); }}>
          {showForm ? 'Cancel' : '+ Record Weight'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3>Record Weight</h3>
            <label>
              <input type="checkbox" checked={bulkMode} onChange={(e) => setBulkMode(e.target.checked)} />
              {' '}Bulk Entry
            </label>
          </div>

          {!bulkMode ? (
            <form onSubmit={handleSingleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Pig *</label>
                  <select value={formData.pigId} onChange={(e) => setFormData({ ...formData, pigId: e.target.value })} required>
                    <option value="">Select a pig</option>
                    {pigs.map((pig) => (
                      <option key={pig.id} value={pig.id}>{pig.manual_id} - {pig.rfid_id}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Weight (kg) *</label>
                  <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Recorded Date *</label>
                  <input type="date" value={formData.recordedDate} onChange={(e) => setFormData({ ...formData, recordedDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Recorded By</label>
                  <input type="text" value={formData.recordedBy} onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Record Weight</button>
            </form>
          ) : (
            <>
              <textarea value={bulkData} onChange={(e) => setBulkData(e.target.value)} placeholder='[{"pigId":"","weight":50,"recordedDate":"2024-01-01","recordedBy":""}]' style={{ height: '200px' }} />
              <button onClick={handleBulkSubmit} className="btn btn-primary">Upload Bulk</button>
            </>
          )}
        </div>
      )}

      <div className="card">
        <h3>Weight Recording Information</h3>
        <p>Record pig weights regularly to track growth trends and monitor health. Weights are updated to the pig's current weight field.</p>
      </div>
    </div>
  );
}

export default WeightTracking;
