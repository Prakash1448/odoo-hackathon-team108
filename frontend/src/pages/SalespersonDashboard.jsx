import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

export default function SalespersonDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const salesperson = JSON.parse(localStorage.getItem('salesperson') || '{}');
  const token = localStorage.getItem('salespersonToken');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch dashboard data
      const dashboardResponse = await axios.get('http://localhost:5000/salesperson/dashboard', { headers });
      setDashboard(dashboardResponse.data);

      // Fetch recent requests
      const requestsResponse = await axios.get('http://localhost:5000/salesperson/requests', { headers });
      setRecentRequests(requestsResponse.data.slice(0, 5)); // Show 5 most recent
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard');
      if (err.response?.status === 401) {
        localStorage.removeItem('salespersonToken');
        localStorage.removeItem('salesperson');
        navigate('/salesperson/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <p>Welcome, {salesperson.fullName || 'Salesperson'}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {dashboard && (
        <>
          <div className="dashboard-grid">
            <div className="summary-card">
              <div className="card-value">{dashboard.totalRequests}</div>
              <div className="card-label">Total Requests</div>
            </div>

            <div className="summary-card">
              <div className="card-value">{dashboard.pendingRequests}</div>
              <div className="card-label">Pending Requests</div>
            </div>

            <div className="summary-card">
              <div className="card-value">{dashboard.quotationsCreated}</div>
              <div className="card-label">Quotations Created</div>
            </div>

            <div className="summary-card">
              <div className="card-value">{dashboard.quotationsSent}</div>
              <div className="card-label">Quotations Sent</div>
            </div>

            <div className="summary-card">
              <div className="card-value">{dashboard.quotationsAwaitingAction}</div>
              <div className="card-label">Awaiting Action</div>
            </div>

            <div className="summary-card">
              <div className="card-value">{dashboard.activeDiscountRequests}</div>
              <div className="card-label">Discount Requests</div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Recent Customer Requests</h2>
            {recentRequests.length > 0 ? (
              <div className="requests-table">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.map(req => (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>{req.product_requirement}</td>
                        <td>{req.quantity}</td>
                        <td><span className={`status-badge status-${req.status?.replace(/\s/g, '-').toLowerCase()}`}>{req.status}</span></td>
                        <td>{req.created_at}</td>
                        <td>
                          <button 
                            className="view-button"
                            onClick={() => navigate(`/salesperson/requests/${req.id}`)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No requests available</p>
            )}
            <button 
              className="view-all-button"
              onClick={() => navigate('/salesperson/requests')}
            >
              View All Requests
            </button>
          </div>

          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button 
                className="action-button"
                onClick={() => navigate('/salesperson/requests')}
              >
                📋 View All Requests
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/salesperson/quotations')}
              >
                📊 View Quotations
              </button>
              <button 
                className="action-button"
                onClick={() => navigate('/salesperson/discount-requests')}
              >
                🔄 Discount Requests
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
