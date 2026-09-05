import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/List.css';

export default function SalespersonQuotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const token = localStorage.getItem('salespersonToken');

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/salesperson/quotations', { headers });
      setQuotations(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch quotations');
      if (err.response?.status === 401) {
        localStorage.removeItem('salespersonToken');
        navigate('/salesperson/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['All', 'Draft', 'Sent', 'Awaiting Customer Response', 'Counter Offer', 'Accepted', 'Rejected', 'Expired'];

  const filteredQuotations = filterStatus === 'All' 
    ? quotations 
    : quotations.filter(q => q.status === filterStatus);

  if (loading) {
    return <div className="loading">Loading quotations...</div>;
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <h1>Quotations</h1>
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

      {filteredQuotations.length > 0 ? (
        <div className="quotations-table">
          <table>
            <thead>
              <tr>
                <th>Quotation ID</th>
                <th>Request ID</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map(q => (
                <tr key={q.id}>
                  <td><strong>{q.id.substring(0, 8)}...</strong></td>
                  <td>{q.requestId}</td>
                  <td>{q.productRequirement}</td>
                  <td>{q.customer.name}</td>
                  <td><span className={`status-badge status-${q.status?.replace(/\s/g, '-').toLowerCase()}`}>{q.status}</span></td>
                  <td>{q.validUntil || '-'}</td>
                  <td>{q.createdAt}</td>
                  <td>
                    <button 
                      className="view-button"
                      onClick={() => navigate(`/salesperson/quotations/${q.id}`)}
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
        <p className="no-data">No quotations found</p>
      )}
    </div>
  );
}
