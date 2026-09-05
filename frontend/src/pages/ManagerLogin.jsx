import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { managerAuthAPI } from '../api';
import '../styles/Auth.css';

export default function ManagerLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);

    try {
      const response = await managerAuthAPI.login(formData);
      localStorage.setItem('authToken', response.data.access_token || response.data.token);
      localStorage.setItem('userRole', response.data.user?.role || 'SALES_MANAGER');
      localStorage.setItem('manager', JSON.stringify(response.data.manager));
      navigate('/manager/dashboard');
    } catch (err) {
      setError(err.response
        ? err.response.data?.error || 'Invalid email or password'
        : 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Sales Manager Login</h1>
          <p>Access manager approval dashboard</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="manager@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Not a sales manager? <a href="/login">Customer Login</a></p>
          <p><a href="/salesperson/login">Salesperson Login</a></p>
        </div>
      </div>
    </div>
  );
}
