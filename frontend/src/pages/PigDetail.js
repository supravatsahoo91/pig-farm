import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pigsAPI } from '../services/api';

function PigDetail() {
  const { rfidId } = useParams();
  const [pig, setPig] = useState(null);
  const [genealogy, setGenealogy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPigData();
  }, [rfidId]);

  const fetchPigData = async () => {
    try {
      const pigResult = await pigsAPI.getById(rfidId);
      const genealogyResult = await pigsAPI.getGenealogy(rfidId);
      setPig(pigResult.data.data);
      setGenealogy(genealogyResult.data.data);
    } catch (err) {
      console.error('Failed to fetch pig details', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="main-content"><div className="loading">Loading...</div></div>;
  if (!pig) return <div className="main-content"><div className="alert alert-error">Pig not found</div></div>;

  return (
    <div className="main-content">
      <h1>Pig Details: {pig.manual_id}</h1>
      <div className="card">
        <div className="form-row">
          <div><strong>RFID ID:</strong> {pig.rfid_id}</div>
          <div><strong>Gender:</strong> {pig.gender}</div>
          <div><strong>Status:</strong> {pig.status}</div>
        </div>
        <div className="form-row">
          <div><strong>Date of Birth:</strong> {new Date(pig.date_of_birth).toLocaleDateString()}</div>
          <div><strong>Current Weight:</strong> {pig.current_weight || 'N/A'} kg</div>
          <div><strong>Breed:</strong> {pig.breed_type || 'N/A'}</div>
        </div>
      </div>
      {genealogy && (
        <div className="card">
          <h3>Genealogy</h3>
          <p><strong>Parents:</strong> {genealogy.ancestors?.filter(a => a.generation === 1).length || 0}</p>
          <p><strong>Offspring:</strong> {genealogy.offspring?.length || 0}</p>
        </div>
      )}
    </div>
  );
}

export default PigDetail;
