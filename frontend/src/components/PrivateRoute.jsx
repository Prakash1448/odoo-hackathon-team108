import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const customerToken = localStorage.getItem('authToken');
  const salespersonToken = localStorage.getItem('salespersonToken');
  const token = customerToken || salespersonToken;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
