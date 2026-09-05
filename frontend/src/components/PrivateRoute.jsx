import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const customerToken = localStorage.getItem('authToken');
  const salespersonToken = localStorage.getItem('salespersonToken');
  const path = window.location.pathname;
  let token = customerToken;
  if (path.startsWith('/salesperson')) {
    token = salespersonToken;
  }

  if (!token) {
    let loginPath = '/login';
    if (path.startsWith('/salesperson')) {
      loginPath = '/salesperson/login';
    } else if (path.startsWith('/manager')) {
      loginPath = '/manager/login';
    }
    return <Navigate to={loginPath} replace />;
  }

  return children;
}
