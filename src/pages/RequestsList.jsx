import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api';
import Header from '../components/Header';

export default function RequestsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getRequests();
      setRequests(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', marginBottom: '24px' }}>
          <h1>My Requests</h1>
          <button 
            className="primary"
            onClick={() => navigate('/requests/new')}
          >
            Create Request
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          {requests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <p>No requests yet.</p>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                Create a new request to get started.
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Requirement</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id}>
                    <td><strong>{req.id}</strong></td>
                    <td>{req.request_title}</td>
                    <td>{req.quantity}</td>
                    <td>
                      <span className={`status-badge ${req.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>{req.created_at}</td>
                    <td>
                      <a 
                        href="#" 
                        onClick={() => navigate(`/requests/${req.id}`)}
                        style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '500' }}
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
