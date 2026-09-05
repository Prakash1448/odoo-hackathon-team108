import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api';
import Header from '../components/Header';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getProfile();
      setProfile(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <h1 style={{ marginBottom: '24px', marginTop: '20px' }}>Profile</h1>

        {error && <div className="error">{error}</div>}

        {profile && (
          <div className="card">
            <div className="details-grid">
              <div className="detail-item">
                <div className="detail-label">Full Name</div>
                <div className="detail-value">{profile.fullName}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Company Name</div>
                <div className="detail-value">{profile.companyName}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Email</div>
                <div className="detail-value">{profile.email}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Phone Number</div>
                <div className="detail-value">{profile.phoneNumber}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Member Since</div>
                <div className="detail-value">{profile.createdAt}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Customer ID</div>
                <div className="detail-value" style={{ fontSize: '12px', fontFamily: 'monospace' }}>{profile.id}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
