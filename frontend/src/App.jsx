import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RequestsList from './pages/RequestsList';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import Quotations from './pages/Quotations';
import QuotationDetail from './pages/QuotationDetail';
import Profile from './pages/Profile';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <PrivateRoute>
              <RequestsList />
            </PrivateRoute>
          }
        />

        <Route
          path="/requests/new"
          element={
            <PrivateRoute>
              <CreateRequest />
            </PrivateRoute>
          }
        />

        <Route
          path="/requests/:requestId"
          element={
            <PrivateRoute>
              <RequestDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/quotations"
          element={
            <PrivateRoute>
              <Quotations />
            </PrivateRoute>
          }
        />

        <Route
          path="/quotations/:quotationId"
          element={
            <PrivateRoute>
              <QuotationDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
