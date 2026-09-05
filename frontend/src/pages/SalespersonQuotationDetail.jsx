import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Detail.css';

export default function SalespersonQuotationDetail() {
  const { quotationId } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const token = localStorage.getItem('salespersonToken');

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`http://localhost:5000/salesperson/quotations/${quotationId}`, { headers });
      setQuotation(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch quotation');
      if (err.response?.status === 401) {
        localStorage.removeItem('salespersonToken');
        navigate('/salesperson/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendQuotation = async () => {
    try {
      setSending(true);
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`http://localhost:5000/salesperson/quotations/${quotationId}/send`,
        {},
        { headers }
      );
      alert('Quotation sent to customer successfully!');
      fetchQuotation();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send quotation');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading quotation...</div>;
  }

  if (!quotation) {
    return <div className="error-message">Quotation not found</div>;
  }

  return (
    <div className="detail-container">
      <div className="detail-header">
        <h1>Quotation Details</h1>
        <button 
          className="back-button"
          onClick={() => navigate('/salesperson/quotations')}
        >
          ← Back to Quotations
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="detail-card">
        <div className="card-section">
          <h2>Quotation Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Quotation ID</label>
              <div className="info-value">{quotation.id}</div>
            </div>
            <div className="info-item">
              <label>Request ID</label>
              <div className="info-value">{quotation.requestId}</div>
            </div>
            <div className="info-item">
              <label>Status</label>
              <div className={`status-badge status-${quotation.status?.replace(/\s/g, '-').toLowerCase()}`}>
                {quotation.status}
              </div>
            </div>
          </div>
        </div>

        <div className="card-section">
          <h3>Customer Information</h3>
          {quotation.customer && (
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <div className="info-value">{quotation.customer.full_name}</div>
              </div>
              <div className="info-item">
                <label>Company</label>
                <div className="info-value">{quotation.customer.company_name}</div>
              </div>
              <div className="info-item">
                <label>Email</label>
                <div className="info-value">{quotation.customer.email}</div>
              </div>
            </div>
          )}
        </div>

        <div className="card-section">
          <h3>Line Items</h3>
          <table className="line-items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
                <th>Discount %</th>
                <th>Discount Amt</th>
                <th>Tax</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.lineItems.map(item => (
                <tr key={item.id}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{parseFloat(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>₹{parseFloat(item.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>{item.discount_percent}%</td>
                  <td>₹{parseFloat(item.discount_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>₹{parseFloat(item.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td><strong>₹{parseFloat(item.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-section">
          <h3>Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <label>Subtotal</label>
              <div className="summary-value">₹{parseFloat(quotation.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="summary-item">
              <label>Total Discount</label>
              <div className="summary-value negative">-₹{parseFloat(quotation.totalDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="summary-item">
              <label>Tax</label>
              <div className="summary-value">₹{parseFloat(quotation.totalTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="summary-item">
              <label><strong>Total</strong></label>
              <div className="summary-value total"><strong>₹{parseFloat(quotation.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
            </div>
          </div>
        </div>

        {quotation.notes && (
          <div className="card-section">
            <h3>Notes</h3>
            <div className="info-value">{quotation.notes}</div>
          </div>
        )}

        {quotation.validUntil && (
          <div className="card-section">
            <h3>Valid Until</h3>
            <div className="info-value">{quotation.validUntil}</div>
          </div>
        )}

        {quotation.discountRequests && quotation.discountRequests.length > 0 && (
          <div className="card-section">
            <h3>Customer Discount Requests</h3>
            {quotation.discountRequests.map(dr => (
              <div key={dr.id} className="discount-request-item">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Requested Discount</label>
                    <div className="info-value">{dr.requestedDiscount}%</div>
                  </div>
                  <div className="info-item">
                    <label>Current Discount</label>
                    <div className="info-value">{dr.currentDiscount}%</div>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <div className={`status-badge status-${dr.status?.replace(/\s/g, '-').toLowerCase()}`}>{dr.status}</div>
                  </div>
                </div>
                <div className="info-item">
                  <label>Reason</label>
                  <div className="info-value">{dr.reason}</div>
                </div>
                {dr.salespersonResponse && (
                  <div className="info-item">
                    <label>Your Response</label>
                    <div className="info-value">{dr.salespersonResponse}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="action-buttons">
          {quotation.status === 'Draft' && (
            <button 
              className="success-button"
              onClick={handleSendQuotation}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send to Customer'}
            </button>
          )}
          {quotation.status === 'Draft' && (
            <button 
              className="secondary-button"
              onClick={() => navigate(-1)}
            >
              Edit Quotation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
