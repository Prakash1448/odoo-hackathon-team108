import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/Dashboard.css';

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalApprovalRequests: 0,
    pendingApprovals: 0,
    approvedToday: 0,
    rejectedToday: 0,
    awaitingManagerApprovals: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Placeholder data - will be replaced with actual API calls
      setStats({
        totalApprovalRequests: 24,
        pendingApprovals: 7,
        approvedToday: 5,
        rejectedToday: 2,
        awaitingManagerApprovals: 3
      });
      setRecentRequests([
        {
          id: '1',
          quotationNumber: 'Q-00001',
          customer: 'ABC Technologies',
          requestedDiscount: 15,
          currentDiscount: 10,
          status: 'SENT_TO_MANAGER',
          createdAt: 'Sep 5, 2024'
        },
        {
          id: '2',
          quotationNumber: 'Q-00002',
          customer: 'XYZ Enterprises',
          requestedDiscount: 20,
          currentDiscount: 5,
          status: 'SENT_TO_MANAGER',
          createdAt: 'Sep 5, 2024'
        },
        {
          id: '3',
          quotationNumber: 'Q-00003',
          customer: 'Tech Solutions Ltd',
          requestedDiscount: 18,
          currentDiscount: 10,
          status: 'SENT_TO_MANAGER',
          createdAt: 'Sep 4, 2024'
        }
      ]);
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
        <div style={{ marginTop: '20px', marginBottom: '30px' }}>
          <h1>Sales Manager Dashboard</h1>
          <p style={{ color: '#666', fontSize: '14px' }}>Manage discount approvals and quotation negotiations</p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalApprovalRequests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card highlight">
            <div className="stat-value">{stats.pendingApprovals}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.approvedToday}</div>
            <div className="stat-label">Approved Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.rejectedToday}</div>
            <div className="stat-label">Rejected Today</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.awaitingManagerApprovals}</div>
            <div className="stat-label">Awaiting Manager Decision</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '30px' }}>
          <div className="card-header">
            <div className="card-title">Recent Approval Requests</div>
            <button 
              className="secondary" 
              onClick={() => navigate('/manager/approval-requests')}
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              View All
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              <p>No recent approval requests</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>Requested Discount</th>
                  <th>Current Discount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map(request => (
                  <tr key={request.id}>
                    <td><strong>{request.quotationNumber}</strong></td>
                    <td>{request.customer}</td>
                    <td>{request.requestedDiscount}%</td>
                    <td>{request.currentDiscount}%</td>
                    <td>
                      <span className={`status-badge ${request.status.toLowerCase().replace(/_/g, '-')}`}>
                        {request.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{request.createdAt}</td>
                    <td>
                      <button 
                        className="secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => navigate(`/manager/approval-requests/${request.id}`)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#e3f2fd', borderRadius: '4px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px' }}>Approval Workflow Info</h3>
          <ul style={{ fontSize: '14px', lineHeight: '1.8', marginLeft: '20px' }}>
            <li>Discount requests exceeding salesperson authority are sent for your review</li>
            <li>You can approve, reject, or return with counter offers</li>
            <li>Approved discounts are applied to the quotation and sent back to customer</li>
            <li>All actions are logged for audit purposes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
