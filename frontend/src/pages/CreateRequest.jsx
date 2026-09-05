import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api';
import Header from '../components/Header';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    requestTitle: '',
    productRequirement: '',
    quantity: '',
    specifications: '',
    additionalNotes: '',
    expectedDeliveryDate: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate quantity
      const qty = parseInt(formData.quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Quantity must be a positive number');
        setLoading(false);
        return;
      }

      const response = await customerAPI.createRequest({
        requestTitle: formData.requestTitle,
        productRequirement: formData.productRequirement,
        quantity: qty,
        specifications: formData.specifications,
        additionalNotes: formData.additionalNotes,
        expectedDeliveryDate: formData.expectedDeliveryDate
      });

      setSuccess('Request created successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/requests/${response.data.request.id}`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/requests');
  };

  return (
    <div>
      <Header />
      <div className="container">
        <div style={{ marginBottom: '24px', marginTop: '20px' }}>
          <a href="#" onClick={() => navigate('/requests')} className="breadcrumb-link">
            ← Back to Requests
          </a>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Create Sales Request</div>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Request Title * 
                <small style={{ fontWeight: 'normal', marginTop: '4px' }}>
                  Example: "90 Business Laptops for Q4 Expansion"
                </small>
              </label>
              <input
                type="text"
                name="requestTitle"
                value={formData.requestTitle}
                onChange={handleChange}
                placeholder="Brief title for your requirement"
                required
              />
            </div>

            <div className="form-group">
              <label>Product/Requirement *
                <small style={{ fontWeight: 'normal', marginTop: '4px' }}>
                  The main product or service you need
                </small>
              </label>
              <input
                type="text"
                name="productRequirement"
                value={formData.productRequirement}
                onChange={handleChange}
                placeholder="Business Laptop, Server, Software License, etc."
                required
              />
            </div>

            <div className="form-group">
              <label>Quantity *
                <small style={{ fontWeight: 'normal', marginTop: '4px' }}>
                  Number of units needed
                </small>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="90"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Specifications/Requirements
                <small style={{ fontWeight: 'normal', marginTop: '4px' }}>
                  Detailed technical specifications (optional)
                </small>
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleChange}
                placeholder="16GB RAM, 512GB SSD, Intel i7 or equivalent, Windows 11 Pro, etc."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label>Additional Notes
                <small style={{ fontWeight: 'normal', marginTop: '4px' }}>
                  Any special requirements or notes (optional)
                </small>
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Installation, technical support, training requirements, etc."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label>Expected Delivery Date
                <small style={{ fontWeight: 'normal', marginTop: '4px' }}>
                  When do you need this? (optional)
                </small>
              </label>
              <input
                type="date"
                name="expectedDeliveryDate"
                value={formData.expectedDeliveryDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                disabled={loading}
                className="primary"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
              <button 
                type="button" 
                onClick={handleCancel}
                className="secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
