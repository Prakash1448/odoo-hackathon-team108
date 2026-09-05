import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/List.css';

export default function SalespersonRequestsList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const token = localStorage.getItem('salespersonToken');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/salesperson/requests', { headers });
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch requests');
      if (err.response?.status === 401) {
        localStorage.removeItem('salespersonToken');
        navigate('/salesperson/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['All', 'Submitted', 'Under Review', 'Quotation Received', 'Negotiation', 'Approved', 'Accepted', 'Completed'];

  const filteredRequests = filterStatus === 'All' 
    ? requests 
    : requests.filter(req => req.status === filterStatus);

  if (loading) {
    return <div className="loading">Loading requests...</div>;
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <h1>Customer Requests</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/salesperson/dashboard')}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-section">
        <label>Filter by Status:</label>
        <div className="filter-buttons">
          {statuses.map(status => (
            <button
              key={status}
              className={`filter-button ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length > 0 ? (
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
              {filteredRequests.map(req => (
                <tr key={req.id}>
                  <td><strong>{req.id}</strong></td>
                  <td>{req.product_requirement}</td>
                  <td>{req.quantity}</td>
                  <td><span className={`status-badge status-${req.status?.replace(/\s/g, '-').toLowerCase()}`}>{req.status}</span></td>
                  <td>{req.created_at}</td>
                  <td>
                    <button 
                      className="view-button"
                      onClick={() => navigate(`/salesperson/requests/${req.id}`)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data">No requests found</p>
      )}
    </div>
  );
}
