import React, { useState, useEffect } from 'react';
import { salesAPI, pigsAPI } from '../services/api';
import '../styles/Pages.css';

function SalesManagement() {
  const [sales, setSales] = useState([]);
  const [pigs, setPigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [formData, setFormData] = useState({
    pigId: '', saleDate: '', salePrice: '', buyerName: '', quantity: 1, saleNotes: ''
  });

  useEffect(() => {
    fetchSales();
    fetchPigs();
  }, [page]);

  const fetchSales = async () => {
    try {
      const result = await salesAPI.getAll(page, 50);
      setSales(result.data.data);
    } catch (err) {
      setError('Failed to fetch sales');
    }
  };

  const fetchPigs = async () => {
    try {
      const result = await pigsAPI.getAll(1, 100);
      setPigs(result.data.data.filter(p => p.status === 'active'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await salesAPI.recordSale(formData);
      setFormData({ pigId: '', saleDate: '', salePrice: '', buyerName: '', quantity: 1, saleNotes: '' });
      setShowForm(false);
      setPage(1);
      await fetchSales();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record sale');
    }
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Sales Management</h1>
        <button className="btn btn-success" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Record Sale'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <div className="card-header"><h3>Record Sale</h3></div>
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
                <label>Sale Date *</label>
                <input type="date" value={formData.saleDate} onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Sale Price *</label>
                <input type="number" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Buyer Name</label>
              <input type="text" value={formData.buyerName} onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Record Sale</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3>Recent Sales</h3>
        {sales.length === 0 ? (
          <p>No sales recorded</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Pig</th>
                  <th>Sale Date</th>
                  <th>Price</th>
                  <th>Buyer</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id}>
                    <td>{s.manual_id}</td>
                    <td>{new Date(s.sale_date).toLocaleDateString()}</td>
                    <td>${s.sale_price}</td>
                    <td>{s.buyer_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span>Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={sales.length < 50}>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SalesManagement;
