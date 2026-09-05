import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api';
import Header from '../components/Header';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardRes, requestsRes] = await Promise.all([
        customerAPI.getDashboard(),
        customerAPI.getRequests()
      ]);
      setDashboard(dashboardRes.data);
      setRequests(requestsRes.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
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
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      
      <div className="container">
        <h1 style={{ marginBottom: '24px', marginTop: '20px' }}>Dashboard</h1>

        {error && <div className="error">{error}</div>}

        {dashboard && (
          <>
            <div className="dashboard-grid">
              <SummaryCard
                label="Total Requests"
                value={dashboard.totalRequests}
              />
              <SummaryCard
                label="Pending Requests"
                value={dashboard.pendingRequests}
                className="pending"
              />
              <SummaryCard
                label="Quotations Received"
                value={dashboard.quotationsReceived}
                className="quotations"
              />
              <SummaryCard
                label="Awaiting Action"
                value={dashboard.quotationsAwaitingAction}
              />
              <SummaryCard
                label="Discount Requests"
                value={dashboard.discountRequests}
                className="discount"
              />
              <SummaryCard
                label="Accepted Quotations"
                value={dashboard.acceptedQuotations}
                className="quotations"
              />
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Requests</div>
                <button 
                  className="primary"
                  onClick={() => navigate('/requests/new')}
                >
                  Create Request
                </button>
              </div>

              {requests.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  No requests yet. <a href="#" onClick={() => navigate('/requests/new')}>Create your first request</a>
                </p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Requirement</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Date</th>
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
                          <span className={`status-badge ${req.status.toLowerCase().replace(' ', '-')}`}>
                            {req.status}
                          </span>
                        </td>
                        <td>{req.created_at}</td>
                        <td>
                          <a 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/requests/${req.id}`);
                            }}
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
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, className = '' }) {
  return (
    <div className={`summary-card ${className}`}>
      <div className="summary-label">{label}</div>
      <div className="summary-number">{value}</div>
    </div>
  );
}
