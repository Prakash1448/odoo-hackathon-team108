import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI, quotationAPI } from '../api';
import Header from '../components/Header';

export default function RequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getRequest(requestId);
      setRequest(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuotation = () => {
    if (request?.quotation?.id) {
      navigate(`/quotations/${request.quotation.id}`);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading request...</p>
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
          <a href="#" onClick={() => navigate('/requests')} className="breadcrumb-link">
            ← Back to Requests
          </a>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div className="card-title">{request.request_title}</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Request ID: <strong>{request.id}</strong>
              </div>
            </div>
            <div>
              <span className={`status-badge ${request.status.toLowerCase().replace(' ', '-')}`}>
                {request.status}
              </span>
            </div>
          </div>

          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-label">Product/Requirement</div>
              <div className="detail-value">{request.product_requirement}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Quantity</div>
              <div className="detail-value">{request.quantity}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Created Date</div>
              <div className="detail-value">{request.createdAt}</div>
            </div>

            {request.expected_delivery_date && (
              <div className="detail-item">
                <div className="detail-label">Expected Delivery</div>
                <div className="detail-value">{request.expected_delivery_date}</div>
              </div>
            )}
          </div>

          {request.specifications && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Specifications</h3>
              <div style={{ 
                background: '#f9fafc', 
                padding: '16px', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {request.specifications}
              </div>
            </div>
          )}

          {request.additional_notes && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Additional Notes</h3>
              <div style={{ 
                background: '#f9fafc', 
                padding: '16px', 
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {request.additional_notes}
              </div>
            </div>
          )}
        </div>

        {request.quotation && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Quotation</div>
              <span className={`status-badge ${request.quotation.status.toLowerCase().replace(' ', '-')}`}>
                {request.quotation.status}
              </span>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Quotation ID</div>
                <div className="detail-value">{request.quotation.id}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Total Amount</div>
                <div className="detail-value" style={{ fontSize: '18px', color: '#0066cc', fontWeight: '700' }}>
                  ₹{parseFloat(request.quotation.total).toLocaleString('en-IN', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Valid Until</div>
                <div className="detail-value">{request.quotation.validUntil || 'Not specified'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Created Date</div>
                <div className="detail-value">{request.quotation.createdAt}</div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button 
                className="primary"
                onClick={handleViewQuotation}
              >
                View Full Quotation
              </button>
            </div>
          </div>
        )}

        {!request.quotation && request.status === 'Submitted' && (
          <div className="card">
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <p>Your request has been submitted. A quotation will be generated soon.</p>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                We'll notify you when the quotation is ready for review.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
