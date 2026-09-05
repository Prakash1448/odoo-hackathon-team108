import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Auth.css';

export default function SalespersonLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/auth/salesperson/login', {
        email: formData.email,
        password: formData.password
      });

      const { token, salesperson } = response.data;
      
      // Store token and salesperson info
      localStorage.setItem('salespersonToken', token);
      localStorage.setItem('salesperson', JSON.stringify(salesperson));
      localStorage.setItem('userType', 'salesperson');

      // Redirect to salesperson dashboard
      navigate('/salesperson/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Salesperson Login</h1>
        <p className="auth-subtitle">DealFlow360 Sales Portal</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
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

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              className="link-button"
              onClick={() => navigate('/salesperson/register')}
            >
              Register here
            </button>
          </p>
          <p>
            <button 
              type="button" 
              className="link-button"
              onClick={() => navigate('/login')}
            >
              Customer Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
