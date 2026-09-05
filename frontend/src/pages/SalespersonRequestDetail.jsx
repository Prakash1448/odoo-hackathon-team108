import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Detail.css';

export default function SalespersonRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationData, setQuotationData] = useState({
    lineItems: [{ product_name: '', quantity: 1, unit_price: 0 }],
    discount: 0,
    taxPercent: 10,
    validUntil: '',
    notes: ''
  });

  const token = localStorage.getItem('salespersonToken');
  const statuses = ['Submitted', 'Under Review', 'Quotation Received', 'Negotiation', 'Approved', 'Accepted', 'Completed'];

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:5000/salesperson/requests/${requestId}`, { headers });
      setRequest(response.data);
      setNewStatus(response.data.status);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch request');
      if (err.response?.status === 401) {
        localStorage.removeItem('salespersonToken');
        navigate('/salesperson/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (newStatus === request.status) {
      setShowStatusModal(false);
      return;
    }

    try {
      setStatusUpdating(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.patch(`http://localhost:5000/salesperson/requests/${requestId}/status`, 
        { status: newStatus }, 
        { headers }
      );
      setRequest(prev => ({ ...prev, status: newStatus }));
      setShowStatusModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const updated = [...quotationData.lineItems];
    updated[index] = { ...updated[index], [field]: field === 'quantity' ? parseInt(value) : parseFloat(value) || value };
    setQuotationData(prev => ({ ...prev, lineItems: updated }));
  };

  const addLineItem = () => {
    setQuotationData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { product_name: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const handleCreateQuotation = async () => {
    try {
      // Validation
      if (quotationData.lineItems.some(item => !item.product_name || item.quantity <= 0 || item.unit_price < 0)) {
        setError('Please fill all line items correctly');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(`http://localhost:5000/salesperson/requests/${requestId}/quotation`,
        quotationData,
        { headers }
      );
      
      setShowQuotationModal(false);
      alert('Quotation created successfully!');
      navigate(`/salesperson/quotations/${response.data.quotation.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create quotation');
    }
  };

  if (loading) {
    return <div className="loading">Loading request details...</div>;
  }

  if (!request) {
    return <div className="error-message">Request not found</div>;
  }

  return (
    <div className="detail-container">
      <div className="detail-header">
        <h1>Request Details</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/salesperson/requests')}
        >
          ← Back to Requests
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="detail-card">
        <div className="card-section">
          <h2>Request Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Request ID</label>
              <div className="info-value">{request.id}</div>
            </div>
            <div className="info-item">
              <label>Status</label>
              <div className={`status-badge status-${request.status?.replace(/\s/g, '-').toLowerCase()}`}>
                {request.status}
              </div>
            </div>
            <div className="info-item">
              <label>Created</label>
              <div className="info-value">{request.createdAt}</div>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Title</label>
              <div className="info-value">{request.request_title}</div>
            </div>
            <div className="info-item">
              <label>Product Requirement</label>
              <div className="info-value">{request.product_requirement}</div>
            </div>
            <div className="info-item">
              <label>Quantity</label>
              <div className="info-value">{request.quantity}</div>
            </div>
          </div>

          {request.specifications && (
            <div className="info-item">
              <label>Specifications</label>
              <div className="info-value">{request.specifications}</div>
            </div>
          )}

          {request.additional_notes && (
            <div className="info-item">
              <label>Additional Notes</label>
              <div className="info-value">{request.additional_notes}</div>
            </div>
          )}

          {request.expected_delivery_date && (
            <div className="info-item">
              <label>Expected Delivery Date</label>
              <div className="info-value">{request.expected_delivery_date}</div>
            </div>
          )}
        </div>

        <div className="card-section">
          <h3>Customer Information</h3>
          {request.customer && (
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <div className="info-value">{request.customer.full_name}</div>
              </div>
              <div className="info-item">
                <label>Company</label>
                <div className="info-value">{request.customer.company_name}</div>
              </div>
              <div className="info-item">
                <label>Email</label>
                <div className="info-value">{request.customer.email}</div>
              </div>
            </div>
          )}
        </div>

        {request.quotation && (
          <div className="card-section">
            <h3>Associated Quotation</h3>
            <div className="info-grid">
              <div className="info-item">
                <label>Quotation ID</label>
                <div className="info-value">{request.quotation.id}</div>
              </div>
              <div className="info-item">
                <label>Status</label>
                <div className="info-value">{request.quotation.status}</div>
              </div>
              <div className="info-item">
                <label>Total</label>
                <div className="info-value">₹{parseFloat(request.quotation.total).toLocaleString('en-IN')}</div>
              </div>
            </div>
            <button 
              className="primary-button"
              onClick={() => navigate(`/salesperson/quotations/${request.quotation.id}`)}
            >
              View Quotation
            </button>
          </div>
        )}

        <div className="action-buttons">
          <button 
            className="primary-button"
            onClick={() => setShowStatusModal(true)}
          >
            Update Status
          </button>
          {!request.quotation && (
            <button 
              className="success-button"
              onClick={() => setShowQuotationModal(true)}
            >
              Create Quotation
            </button>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Update Request Status</h2>
            <div className="form-group">
              <label>New Status</label>
              <select 
                value={newStatus} 
                onChange={(e) => setNewStatus(e.target.value)}
                className="form-control"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-button"
                onClick={handleUpdateStatus}
                disabled={statusUpdating}
              >
                {statusUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal */}
      {showQuotationModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <h2>Create Quotation</h2>
            
            <div className="form-group">
              <h3>Line Items</h3>
              {quotationData.lineItems.map((item, index) => (
                <div key={index} className="line-item">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={item.product_name}
                    onChange={(e) => handleLineItemChange(index, 'product_name', e.target.value)}
                    className="form-control"
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                    className="form-control"
                  />
                  <input
                    type="number"
                    placeholder="Unit Price"
                    min="0"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => handleLineItemChange(index, 'unit_price', e.target.value)}
                    className="form-control"
                  />
                </div>
              ))}
              <button 
                className="secondary-button"
                onClick={addLineItem}
              >
                + Add Line Item
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={quotationData.discount}
                  onChange={(e) => setQuotationData(prev => ({ ...prev, discount: parseFloat(e.target.value) }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label>Tax %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={quotationData.taxPercent}
                  onChange={(e) => setQuotationData(prev => ({ ...prev, taxPercent: parseFloat(e.target.value) }))}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Valid Until</label>
              <input
                type="date"
                value={quotationData.validUntil}
                onChange={(e) => setQuotationData(prev => ({ ...prev, validUntil: e.target.value }))}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={quotationData.notes}
                onChange={(e) => setQuotationData(prev => ({ ...prev, notes: e.target.value }))}
                className="form-control"
                rows="3"
              ></textarea>
            </div>

            <div className="modal-buttons">
              <button 
                className="cancel-button"
                onClick={() => setShowQuotationModal(false)}
              >
                Cancel
              </button>
              <button 
                className="success-button"
                onClick={handleCreateQuotation}
              >
                Create Quotation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
