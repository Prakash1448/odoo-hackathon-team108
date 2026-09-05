import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/List.css';

export default function ManagerApprovalRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const fetchApprovalRequests = async () => {
    try {
      setLoading(true);
      // Placeholder data - will be replaced with actual API calls
      setRequests([
        {
          id: '1',
          quotationNumber: 'Q-00001',
          customer: 'ABC Technologies Pvt Ltd',
          salesperson: 'John Smith',
          requestedDiscount: 15,
          currentDiscount: 10,
          reason: 'Bulk purchase of 90 laptops',
          status: 'PENDING',
          createdAt: 'Sep 5, 2024'
        },
        {
          id: '2',
          quotationNumber: 'Q-00002',
          customer: 'XYZ Enterprises',
          salesperson: 'Sarah Johnson',
          requestedDiscount: 20,
          currentDiscount: 5,
          reason: 'Long-term partnership',
          status: 'PENDING',
          createdAt: 'Sep 5, 2024'
        },
        {
          id: '3',
          quotationNumber: 'Q-00003',
          customer: 'Tech Solutions Ltd',
          salesperson: 'Mike Davis',
          requestedDiscount: 18,
          currentDiscount: 10,
          reason: 'Seasonal promotion',
          status: 'PENDING',
          createdAt: 'Sep 4, 2024'
        },
        {
          id: '4',
          quotationNumber: 'Q-00004',
          customer: 'Digital Innovations',
          salesperson: 'John Smith',
          requestedDiscount: 25,
          currentDiscount: 12,
          reason: 'Volume commitment',
          status: 'APPROVED',
          approvedAt: 'Sep 3, 2024'
        },
        {
          id: '5',
          quotationNumber: 'Q-00005',
          customer: 'Global Services Inc',
          salesperson: 'Sarah Johnson',
          requestedDiscount: 22,
          currentDiscount: 8,
          reason: 'Competitive pricing',
          status: 'REJECTED',
          rejectedAt: 'Sep 2, 2024'
        }
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load approval requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status.toLowerCase() === filter);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading approval requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <div style={{ marginBottom: '24px', marginTop: '20px' }}>
          <a href="#" onClick={() => navigate('/manager/dashboard')} className="breadcrumb-link">
            ← Back to Dashboard
          </a>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Discount Approval Requests</h1>
        </div>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              className={filter === f ? 'primary' : 'secondary'}
              onClick={() => setFilter(f)}
              style={{ textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'All Requests' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filteredRequests.length === 0 ? (
          <div className="card">
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              <p>No approval requests to display</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>Salesperson</th>
                  <th>Requested</th>
                  <th>Current</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => (
                  <tr key={request.id}>
                    <td><strong>{request.quotationNumber}</strong></td>
                    <td>{request.customer}</td>
                    <td>{request.salesperson}</td>
                    <td><strong>{request.requestedDiscount}%</strong></td>
                    <td>{request.currentDiscount}%</td>
                    <td style={{ fontSize: '13px', color: '#666' }}>
                      {request.reason.substring(0, 30)}...
                    </td>
                    <td>
                      <span className={`status-badge ${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>{request.createdAt}</td>
                    <td>
                      <button
                        className="secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => navigate(`/manager/approval-requests/${request.id}`)}
                      >
                        {request.status === 'PENDING' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
