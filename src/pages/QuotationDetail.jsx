import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationAPI } from '../api';
import Header from '../components/Header';

export default function QuotationDetail() {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quotation, setQuotation] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [discountData, setDiscountData] = useState({
    requestedDiscountPercent: '',
    reason: '',
    customerMessage: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationAPI.getQuotation(quotationId);
      setQuotation(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    setDiscountData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestDiscount = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await quotationAPI.requestDiscount(quotationId, {
        requestedDiscountPercent: parseFloat(discountData.requestedDiscountPercent),
        reason: discountData.reason,
        customerMessage: discountData.customerMessage
      });

      setShowDiscountModal(false);
      setDiscountData({
        requestedDiscountPercent: '',
        reason: '',
        customerMessage: ''
      });
      
      // Refresh quotation data
      await fetchQuotation();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request discount');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptQuotation = async () => {
    setError('');
    setSubmitting(true);

    try {
      await quotationAPI.acceptQuotation(quotationId);
      setShowAcceptModal(false);
      
      // Refresh quotation data
      await fetchQuotation();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept quotation');
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
            <p>Loading quotation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="error" style={{ marginTop: '20px' }}>
            Quotation not found
          </div>
        </div>
      </div>
    );
  }

  const canRequestDiscount = quotation.status === 'Awaiting Customer Response' && 
    !quotation.discountRequests?.some(dr => ['Pending Review', 'Requires Manager Approval'].includes(dr.status));
  
  const canAccept = quotation.status === 'Awaiting Customer Response' && !quotation.accepted;

  return (
    <div>
      <Header />
      <div className="container">
        <div style={{ marginBottom: '24px', marginTop: '20px' }}>
          <a href="#" onClick={() => navigate('/quotations')} className="breadcrumb-link">
            ← Back to Quotations
          </a>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div className="card-title">Quotation #{quotation.id}</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Request ID: <strong>{quotation.requestId}</strong>
              </div>
            </div>
            <div>
              <span className={`status-badge ${quotation.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {quotation.status}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '20px', padding: '12px', background: '#e8f5e9', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Total Amount
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#0066cc', marginTop: '8px' }}>
              ₹{parseFloat(quotation.total).toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '24px' }}>Line Items</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Discount</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{parseFloat(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>₹{parseFloat(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    {item.discount_percent}% 
                    {item.discount_amount > 0 && ` (₹${parseFloat(item.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })})`}
                  </td>
                  <td>₹{parseFloat(item.tax_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><strong>₹{parseFloat(item.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'right' }}>
            <div style={{ marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ marginRight: '20px' }}>Subtotal:</span>
              <strong>₹{parseFloat(quotation.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div style={{ marginBottom: '12px', fontSize: '14px', color: '#d32f2f' }}>
              <span style={{ marginRight: '20px' }}>Total Discount:</span>
              <strong>-₹{parseFloat(quotation.totalDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            {parseFloat(quotation.totalTax) > 0 && (
              <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ marginRight: '20px' }}>Tax:</span>
                <strong>₹{parseFloat(quotation.totalTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            )}
            <div style={{ paddingTop: '12px', fontSize: '16px', fontWeight: '700', color: '#0066cc' }}>
              <span style={{ marginRight: '20px' }}>TOTAL:</span>
              ₹{parseFloat(quotation.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {quotation.validUntil && (
            <div style={{ marginTop: '20px', padding: '12px', background: '#fff3e0', borderRadius: '4px', fontSize: '14px' }}>
              <strong>Valid Until:</strong> {quotation.validUntil}
            </div>
          )}

          {quotation.notes && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Terms & Notes</h3>
              <div style={{ 
                background: '#f9fafc', 
                padding: '16px', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {quotation.notes}
              </div>
            </div>
          )}

          {quotation.accepted && (
            <div style={{ marginTop: '20px', padding: '12px', background: '#e8f5e9', borderRadius: '4px', fontSize: '14px' }}>
              <strong>✓ Quotation Accepted</strong> on {quotation.acceptedAt}
            </div>
          )}
        </div>

        {quotation.discountRequests && quotation.discountRequests.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Discount Requests</div>
            </div>

            {quotation.discountRequests.map((dr, idx) => (
              <div key={idx} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: idx < quotation.discountRequests.length - 1 ? '1px solid #eee' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontWeight: '600', marginRight: '20px' }}>
                      Requested: {dr.requestedDiscount}%
                    </span>
                    <span style={{ color: '#666' }}>
                      (Current: {dr.currentDiscount}%)
                    </span>
                  </div>
                  <span className={`status-badge ${dr.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {dr.status}
                  </span>
                </div>
                <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Reason:</strong> {dr.reason}
                </div>
                {dr.salespersonResponse && (
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Salesperson Response:</strong> {dr.salespersonResponse}
                  </div>
                )}
                {dr.managerApprovalStatus && (
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    <strong>Manager Approval:</strong> {dr.managerApprovalStatus}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  Requested on {dr.createdAt}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {canRequestDiscount && (
            <button 
              className="secondary"
              onClick={() => setShowDiscountModal(true)}
            >
              Request Discount / Negotiate
            </button>
          )}
          
          {canAccept && (
            <button 
              className="primary"
              onClick={() => setShowAcceptModal(true)}
            >
              Accept Quotation
            </button>
          )}

          <button 
            className="secondary"
            onClick={() => navigate('/quotations')}
          >
            Back to Quotations
          </button>
        </div>
      </div>

      {showDiscountModal && (
        <Modal onClose={() => setShowDiscountModal(false)}>
          <div className="modal-header">Request Discount / Negotiate</div>
          <form onSubmit={handleRequestDiscount} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label>Requested Discount % *
                <small style={{ fontWeight: 'normal', marginTop: '4px' }}>
                  Current discount: {quotation.lineItems[0]?.discount_percent || 0}%
                </small>
              </label>
              <input
                type="number"
                name="requestedDiscountPercent"
                value={discountData.requestedDiscountPercent}
                onChange={handleDiscountChange}
                placeholder="15"
                min="0"
                max="100"
                step="0.5"
                required
              />
            </div>

            <div className="form-group">
              <label>Reason for Request *</label>
              <textarea
                name="reason"
                value={discountData.reason}
                onChange={handleDiscountChange}
                placeholder="We are purchasing 90 laptops as a bulk order. Please provide a better discount."
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>Additional Message (Optional)</label>
              <textarea
                name="customerMessage"
                value={discountData.customerMessage}
                onChange={handleDiscountChange}
                placeholder="Any additional information for the sales team"
                rows="2"
              />
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="secondary"
                onClick={() => setShowDiscountModal(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAcceptModal && (
        <Modal onClose={() => setShowAcceptModal(false)}>
          <div className="modal-header">Accept Quotation</div>
          <div className="modal-body">
            <p>You are accepting quotation <strong>#{quotation.id}</strong> for:</p>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: '#0066cc', 
              marginTop: '20px',
              textAlign: 'center'
            }}>
              ₹{parseFloat(quotation.total).toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </div>
            <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
              Please confirm that you want to proceed with this quotation.
            </p>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="secondary"
              onClick={() => setShowAcceptModal(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="primary"
              onClick={handleAcceptQuotation}
              disabled={submitting}
            >
              {submitting ? 'Accepting...' : 'Yes, Accept Quotation'}
            </button>
          </div>
        </Modal>
      )}
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
