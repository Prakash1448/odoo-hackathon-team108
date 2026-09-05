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
import SalespersonLogin from './pages/SalespersonLogin';
import SalespersonRegister from './pages/SalespersonRegister';
import SalespersonDashboard from './pages/SalespersonDashboard';
import SalespersonRequestsList from './pages/SalespersonRequestsList';
import SalespersonRequestDetail from './pages/SalespersonRequestDetail';
import SalespersonQuotations from './pages/SalespersonQuotations';
import SalespersonQuotationDetail from './pages/SalespersonQuotationDetail';
import SalespersonDiscountRequests from './pages/SalespersonDiscountRequests';
import ManagerLogin from './pages/ManagerLogin';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerApprovalRequests from './pages/ManagerApprovalRequests';
import ManagerApprovalDetail from './pages/ManagerApprovalDetail';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes - Customer */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public routes - Salesperson */}
        <Route path="/salesperson/login" element={<SalespersonLogin />} />
        <Route path="/salesperson/register" element={<SalespersonRegister />} />

        {/* Public routes - Manager */}
        <Route path="/manager/login" element={<ManagerLogin />} />

        {/* Protected routes - Customer */}
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

        {/* Protected routes - Salesperson */}
        <Route
          path="/salesperson/dashboard"
          element={
            <PrivateRoute>
              <SalespersonDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/salesperson/requests"
          element={
            <PrivateRoute>
              <SalespersonRequestsList />
            </PrivateRoute>
          }
        />

        <Route
          path="/salesperson/requests/:requestId"
          element={
            <PrivateRoute>
              <SalespersonRequestDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/salesperson/quotations"
          element={
            <PrivateRoute>
              <SalespersonQuotations />
            </PrivateRoute>
          }
        />

        <Route
          path="/salesperson/quotations/:quotationId"
          element={
            <PrivateRoute>
              <SalespersonQuotationDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/salesperson/discount-requests"
          element={
            <PrivateRoute>
              <SalespersonDiscountRequests />
            </PrivateRoute>
          }
        />

        {/* Protected routes - Manager */}
        <Route
          path="/manager/dashboard"
          element={
            <PrivateRoute>
              <ManagerDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/manager/approval-requests"
          element={
            <PrivateRoute>
              <ManagerApprovalRequests />
            </PrivateRoute>
          }
        />

        <Route
          path="/manager/approval-requests/:requestId"
          element={
            <PrivateRoute>
              <ManagerApprovalDetail />
            </PrivateRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
