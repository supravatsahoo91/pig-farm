import React, { useState, useEffect } from 'react';
import { pigsAPI } from '../services/api';
import '../styles/Pages.css';

function PigManagement() {
  const [pigs, setPigs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rfidId: '',
    manualId: '',
    dateOfBirth: '',
    gender: 'male',
    breed: '',
    notes: ''
  });

  useEffect(() => {
    fetchPigs();
  }, [page, search, status]);

  const fetchPigs = async () => {
    try {
      setLoading(true);
      const result = await pigsAPI.getAll(page, 50, { search, status });
      setPigs(result.data.data);
      setTotal(result.data.pagination.total);
      setError('');
    } catch (err) {
      setError('Failed to fetch pigs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPig = async (e) => {
    e.preventDefault();
    try {
      await pigsAPI.create(formData);
      setFormData({
        rfidId: '',
        manualId: '',
        dateOfBirth: '',
        gender: 'male',
        breed: '',
        notes: ''
      });
      setShowForm(false);
      setPage(1);
      fetchPigs();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add pig');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Pig Management</h1>
        <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add New Pig'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3>Add New Pig</h3>
          </div>
          <form onSubmit={handleAddPig}>
            <div className="form-row">
              <div className="form-group">
                <label>RFID ID *</label>
                <input
                  type="text"
                  value={formData.rfidId}
                  onChange={(e) => setFormData({ ...formData, rfidId: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Manual ID *</label>
                <input
                  type="text"
                  value={formData.manualId}
                  onChange={(e) => setFormData({ ...formData, manualId: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gender *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Breed Type</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Pig</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by RFID or Manual ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="deceased">Deceased</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading pigs...</div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>RFID ID</th>
                  <th>Manual ID</th>
                  <th>Gender</th>
                  <th>Breed</th>
                  <th>Date of Birth</th>
                  <th>Status</th>
                  <th>Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {pigs.map((pig) => (
                  <tr key={pig.id}>
                    <td>{pig.rfid_id}</td>
                    <td>{pig.manual_id}</td>
                    <td>{pig.gender}</td>
                    <td>{pig.breed_type || '-'}</td>
                    <td>{new Date(pig.date_of_birth).toLocaleDateString()}</td>
                    <td>{pig.status}</td>
                    <td>{pig.current_weight || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={pigs.length < 50}>
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PigManagement;
