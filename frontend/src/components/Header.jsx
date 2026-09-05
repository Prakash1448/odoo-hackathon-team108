import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('customer');
    navigate('/login');
  };

  return (
    <div className="header">
      <div className="header-content">
        <div className="logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          DealFlow360
        </div>
        <nav className="nav">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
            className={isActive('/dashboard') ? 'active' : ''}
          >
            Dashboard
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/requests');
            }}
            className={isActive('/requests') ? 'active' : ''}
          >
            My Requests
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/quotations');
            }}
            className={isActive('/quotations') ? 'active' : ''}
          >
            Quotations
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/profile');
            }}
            className={isActive('/profile') ? 'active' : ''}
          >
            Profile
          </a>
          <button 
            className="secondary"
            onClick={handleLogout}
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
}
