import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationAPI } from '../api';
import Header from '../components/Header';

export default function Quotations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await quotationAPI.getQuotations();
      setQuotations(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch quotations');
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
            <p>Loading quotations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <h1 style={{ marginBottom: '24px', marginTop: '20px' }}>Quotations</h1>

        {error && <div className="error">{error}</div>}

        <div className="card">
          {quotations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <p>No quotations yet.</p>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                Submit a request to receive quotations from our sales team.
              </p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Quotation ID</th>
                  <th>Request</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Valid Until</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id}>
                    <td><strong>{q.id}</strong></td>
                    <td>{q.requestTitle}</td>
                    <td>{q.quantity}</td>
                    <td>
                      <span className={`status-badge ${q.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {q.status}
                      </span>
                    </td>
                    <td>{q.validUntil || 'Not specified'}</td>
                    <td>{q.createdAt}</td>
                    <td>
                      <a 
                        href="#" 
                        onClick={() => navigate(`/quotations/${q.id}`)}
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
