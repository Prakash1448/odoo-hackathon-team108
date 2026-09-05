import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function ManagerApprovalDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);
  const [action, setAction] = useState(''); // approve, reject, counter
  const [actionData, setActionData] = useState({
    response: '',
    counterOfferDiscount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchRequestDetail();
  }, [requestId]);

  const fetchRequestDetail = async () => {
    try {
      setLoading(true);
      // Placeholder data
      setRequest({
        id: requestId,
        quotationNumber: 'Q-00001',
        customer: 'ABC Technologies Pvt Ltd',
        customerEmail: 'contact@abc-tech.com',
        salesperson: 'John Smith',
        salespersonEmail: 'john@company.com',
        currentDiscount: 10,
        requestedDiscount: 15,
        reason: 'We are purchasing 90 business laptops for our organization. We would like to negotiate a better discount given the bulk nature of this purchase.',
        salespersonResponse: 'Customer is a good long-term partner. Can offer up to 12% discount without manager approval.',
        quotationDetails: {
          quotationNumber: 'Q-00001',
          total: 4500000,
          lineItems: [
            { product: 'Business Laptop', quantity: 90, unitPrice: 50000, subtotal: 4500000 }
          ]
        },
        status: 'PENDING',
        createdAt: 'Sep 5, 2024 10:30 AM'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleActionChange = (newAction) => {
    setAction(newAction);
    setActionData({
      response: '',
      counterOfferDiscount: ''
    });
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setActionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAction = async () => {
    setError('');
    setSubmitting(true);

    try {
      // Placeholder - will be replaced with actual API calls
      // await managerAPI[action](requestId, actionData);
      
      setShowConfirm(false);
      alert(`Discount request ${action}ed successfully!`);
      navigate('/manager/approval-requests');
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action} request`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading request details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="error" style={{ marginTop: '20px' }}>
            Request not found
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
          <a href="#" onClick={() => navigate('/manager/approval-requests')} className="breadcrumb-link">
            ← Back to Approval Requests
          </a>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div className="card-title">Discount Approval Request</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Quotation: <strong>{request.quotationNumber}</strong>
              </div>
            </div>
            <div>
              <span className={`status-badge ${request.status.toLowerCase()}`}>
                {request.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Customer</div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{request.customer}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{request.customerEmail}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>Salesperson</div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{request.salesperson}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{request.salespersonEmail}</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Discount Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Current Discount</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#0066cc' }}>{request.currentDiscount}%</div>
              </div>
              <div style={{ padding: '16px', background: '#ffe0e0', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Requested Discount</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#d32f2f' }}>{request.requestedDiscount}%</div>
              </div>
              <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Difference</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff9800' }}>+{request.requestedDiscount - request.currentDiscount}%</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Customer Request</h3>
            <div style={{ background: '#f9fafc', padding: '16px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
              {request.reason}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Salesperson Assessment</h3>
            <div style={{ background: '#f9fafc', padding: '16px', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
              {request.salespersonResponse}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #eee', paddingTop: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Quotation Summary</h3>
            <table className="table" style={{ marginBottom: '16px' }}>
              <tbody>
                {request.quotationDetails.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product}</td>
                    <td>{item.quantity} x ₹{item.unitPrice.toLocaleString()}</td>
                    <td><strong>₹{item.subtotal.toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', padding: '12px 0', fontSize: '16px', fontWeight: '700' }}>
              Total: ₹{request.quotationDetails.total.toLocaleString()}
            </div>
          </div>
        </div>

        {request.status === 'PENDING' && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Manager Decision</div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  className={action === 'approve' ? 'primary' : 'secondary'}
                  onClick={() => handleActionChange('approve')}
                  style={{ flex: '1', minWidth: '120px' }}
                >
                  ✓ Approve
                </button>
                <button
                  className={action === 'reject' ? 'primary' : 'secondary'}
                  onClick={() => handleActionChange('reject')}
                  style={{ flex: '1', minWidth: '120px' }}
                >
                  ✕ Reject
                </button>
                <button
                  className={action === 'counter' ? 'primary' : 'secondary'}
                  onClick={() => handleActionChange('counter')}
                  style={{ flex: '1', minWidth: '120px' }}
                >
                  ↔ Counter Offer
                </button>
              </div>

              {action && (
                <div style={{ 
                  padding: '20px', 
                  background: '#f9fafc', 
                  borderRadius: '4px',
                  borderLeft: '4px solid #0066cc'
                }}>
                  {action === 'approve' && (
                    <div>
                      <h4 style={{ marginBottom: '12px' }}>Approve Discount Request</h4>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                        The customer's requested discount of <strong>{request.requestedDiscount}%</strong> will be approved and applied to their quotation.
                      </p>
                      <div className="form-group">
                        <label>Approval Response (Optional)</label>
                        <textarea
                          name="response"
                          value={actionData.response}
                          onChange={handleDataChange}
                          placeholder="Add any notes or conditions for this approval..."
                          rows="3"
                        />
                      </div>
                    </div>
                  )}

                  {action === 'reject' && (
                    <div>
                      <h4 style={{ marginBottom: '12px' }}>Reject Discount Request</h4>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                        The customer's requested discount of <strong>{request.requestedDiscount}%</strong> will be rejected.
                      </p>
                      <div className="form-group">
                        <label>Rejection Reason *</label>
                        <textarea
                          name="response"
                          value={actionData.response}
                          onChange={handleDataChange}
                          placeholder="Please explain why this discount cannot be approved..."
                          rows="3"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {action === 'counter' && (
                    <div>
                      <h4 style={{ marginBottom: '12px' }}>Make Counter Offer</h4>
                      <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                        Offer a different discount than the requested <strong>{request.requestedDiscount}%</strong>.
                      </p>
                      <div className="form-group">
                        <label>Counter Offer Discount % *</label>
                        <input
                          type="number"
                          name="counterOfferDiscount"
                          value={actionData.counterOfferDiscount}
                          onChange={handleDataChange}
                          placeholder="13"
                          min="0"
                          max="100"
                          step="0.5"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Message to Customer *</label>
                        <textarea
                          name="response"
                          value={actionData.response}
                          onChange={handleDataChange}
                          placeholder="Explain the counter offer..."
                          rows="3"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      className="primary"
                      onClick={() => setShowConfirm(true)}
                      disabled={submitting || !actionData.response || (action === 'counter' && !actionData.counterOfferDiscount)}
                    >
                      {submitting ? 'Processing...' : 'Confirm'}
                    </button>
                    <button
                      className="secondary"
                      onClick={() => handleActionChange('')}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {showConfirm && (
          <Modal onClose={() => setShowConfirm(false)}>
            <div className="modal-header">Confirm {action.charAt(0).toUpperCase() + action.slice(1)}</div>
            <div className="modal-body">
              <p>Are you sure you want to <strong>{action}</strong> this discount request?</p>
              {action === 'approve' && (
                <p style={{ marginTop: '12px', color: '#0066cc', fontWeight: '600' }}>
                  Customer will receive ₹{(request.quotationDetails.total * request.requestedDiscount / 100).toLocaleString()} discount
                </p>
              )}
              {action === 'counter' && (
                <p style={{ marginTop: '12px', color: '#ff9800', fontWeight: '600' }}>
                  Customer will be offered {actionData.counterOfferDiscount}% discount instead
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="secondary"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="primary"
                onClick={handleSubmitAction}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Yes, Confirm'}
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
