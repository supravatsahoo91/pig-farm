import React, { useState } from 'react';
import { pigsAPI } from '../services/api';
import '../styles/Pages.css';

function Genealogy() {
  const [rfidId, setRfidId] = useState('');
  const [genealogy, setGenealogy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!rfidId.trim()) {
      setError('Please enter an RFID ID');
      return;
    }

    try {
      setLoading(true);
      const result = await pigsAPI.getGenealogy(rfidId);
      setGenealogy(result.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch genealogy');
      setGenealogy(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Genealogy Tracking</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>Pig RFID ID</label>
            <input
              type="text"
              value={rfidId}
              onChange={(e) => setRfidId(e.target.value)}
              placeholder="Enter RFID ID to view genealogy"
            />
          </div>
          <div className="form-group" style={{ paddingTop: '22px' }}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {genealogy && (
        <div className="card">
          <div className="card-header">
            <h3>Genealogy for {genealogy.pig.manual_id}</h3>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Current Pig</h4>
            <table className="table">
              <tbody>
                <tr>
                  <td><strong>RFID ID:</strong></td>
                  <td>{genealogy.pig.rfid_id}</td>
                </tr>
                <tr>
                  <td><strong>Gender:</strong></td>
                  <td>{genealogy.pig.gender}</td>
                </tr>
                <tr>
                  <td><strong>Date of Birth:</strong></td>
                  <td>{new Date(genealogy.pig.date_of_birth).toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {genealogy.ancestors && genealogy.ancestors.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4>Ancestors ({genealogy.ancestors.length})</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Manual ID</th>
                    <th>Gender</th>
                    <th>Relationship</th>
                    <th>Generation</th>
                  </tr>
                </thead>
                <tbody>
                  {genealogy.ancestors.map((a, i) => (
                    <tr key={i}>
                      <td>{a.manual_id}</td>
                      <td>{a.gender}</td>
                      <td>{a.relationship_type}</td>
                      <td>{a.generation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {genealogy.offspring && genealogy.offspring.length > 0 && (
            <div>
              <h4>Offspring ({genealogy.offspring.length})</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Manual ID</th>
                    <th>Gender</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {genealogy.offspring.map((o, i) => (
                    <tr key={i}>
                      <td>{o.manual_id}</td>
                      <td>{o.gender}</td>
                      <td>{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Genealogy;
