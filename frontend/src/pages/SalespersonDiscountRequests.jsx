import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/List.css';

export default function SalespersonDiscountRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const token = localStorage.getItem('salespersonToken');

  useEffect(() => {
    fetchDiscountRequests();
  }, []);

  const fetchDiscountRequests = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('http://localhost:5000/salesperson/discount-requests', { headers });
      setRequests(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch discount requests');
      if (err.response?.status === 401) {
        localStorage.removeItem('salespersonToken');
        navigate('/salesperson/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['All', 'Pending Review', 'Approved', 'Rejected', 'Counter Offer', 'Requires Manager Approval'];
  const responseStatuses = ['Approved', 'Rejected', 'Counter Offer', 'Requires Manager Approval'];

  const filteredRequests = filterStatus === 'All' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  const handleUpdateStatus = async () => {
    if (!selectedRequest || !newStatus) return;

    try {
      setUpdating(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`http://localhost:5000/salesperson/discount-requests/${selectedRequest.id}`,
        { status: newStatus, salespersonResponse: response },
        { headers }
      );
      
      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === selectedRequest.id 
          ? { ...r, status: newStatus, salespersonResponse: response }
          : r
      ));
      
      setShowModal(false);
      setSelectedRequest(null);
      setResponse('');
      setNewStatus('');
      alert('Discount request updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update request');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = (req) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setResponse(req.salespersonResponse || '');
    setShowModal(true);
  };

  if (loading) {
    return <div className="loading">Loading discount requests...</div>;
  }

  return (
    <div className="list-container">
      <div className="list-header">
        <h1>Discount Requests</h1>
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
                <th>Quotation ID</th>
                <th>Customer</th>
                <th>Requested Discount</th>
                <th>Current Discount</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req.id}>
                  <td><strong>{req.id.substring(0, 8)}...</strong></td>
                  <td>{req.quotationId.substring(0, 8)}...</td>
                  <td>{req.customer.name}</td>
                  <td>{req.requestedDiscount}%</td>
                  <td>{req.currentDiscount}%</td>
                  <td><span className={`status-badge status-${req.status?.replace(/\s/g, '-').toLowerCase()}`}>{req.status}</span></td>
                  <td>{req.createdAt}</td>
                  <td>
                    <button 
                      className="view-button"
                      onClick={() => openUpdateModal(req)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-data">No discount requests found</p>
      )}

      {/* Update Modal */}
      {showModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Review Discount Request</h2>
            
            <div className="info-grid">
              <div className="info-item">
                <label>Request ID</label>
                <div className="info-value">{selectedRequest.id}</div>
              </div>
              <div className="info-item">
                <label>Customer</label>
                <div className="info-value">{selectedRequest.customer.name}</div>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <label>Requested Discount</label>
                <div className="info-value">{selectedRequest.requestedDiscount}%</div>
              </div>
              <div className="info-item">
                <label>Current Discount</label>
                <div className="info-value">{selectedRequest.currentDiscount}%</div>
              </div>
            </div>

            <div className="form-group">
              <label>Reason</label>
              <div className="info-value">{selectedRequest.reason}</div>
            </div>

            {selectedRequest.customerMessage && (
              <div className="form-group">
                <label>Customer Message</label>
                <div className="info-value">{selectedRequest.customerMessage}</div>
              </div>
            )}

            <div className="form-group">
              <label>Status</label>
              <select 
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-control"
              >
                {responseStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Your Response</label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Enter your response to the customer..."
                className="form-control"
                rows="4"
              />
            </div>

            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleUpdateStatus}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
