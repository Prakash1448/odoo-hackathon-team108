import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleBasedRoute } from "./routes/RoleBasedRoute";
import { AppShell } from "./layouts/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Placeholder } from "./pages/Placeholder";
import { Login } from "./pages/auth/Login";
import { Signup } from "./pages/auth/Signup";
import { ForgotPassword } from "./pages/auth/ForgotPassword";
import { ResetPassword } from "./pages/auth/ResetPassword";
import { Unauthorized } from "./pages/auth/Unauthorized";

import { Quotations } from "./pages/sales/Quotations";
import { Pipeline } from "./pages/sales/Pipeline";

import { QuotationBuilder } from "./pages/sales/QuotationBuilder";
import { ApprovalQueue } from "./pages/approvals/ApprovalQueue";
import { UpsellRules } from "./pages/admin/UpsellRules";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { Users } from "./pages/admin/Users";

import { FulfillmentList } from "./pages/operations/FulfillmentList";
import { FulfillmentDetail } from "./pages/operations/FulfillmentDetail";
import { SubscriptionsList } from "./pages/operations/SubscriptionsList";
import { InvoicesList } from "./pages/invoices/InvoicesList";
import { InvoiceDetail } from "./pages/invoices/InvoiceDetail";
import { CustomerDashboard } from "./pages/portal/CustomerDashboard";
import { CustomerNegotiation } from "./pages/portal/CustomerNegotiation";
import { DealHealth } from "./pages/analytics/DealHealth";
import { Reports } from "./pages/analytics/Reports";

import { WorkflowProvider } from "./context/WorkflowContext";

function App() {
  return (
    <WorkflowProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={
                <RoleBasedRoute allowedRoles={["sales-rep", "sales-manager", "finance", "admin"]}>
                  <Dashboard />
                </RoleBasedRoute>
              } />
              
              {/* Sales */}
              <Route path="sales/quotations" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "sales-manager", "admin"]}>
                  <Quotations />
                </RoleBasedRoute>
              } />
              <Route path="sales/quotations/build/:id?" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "sales-manager", "admin"]}>
                  <QuotationBuilder />
                </RoleBasedRoute>
              } />
              <Route path="sales/pipeline" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "admin"]}>
                  <Pipeline />
                </RoleBasedRoute>
              } />
              
              {/* Operations */}
              <Route path="operations/fulfillment" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "finance", "admin"]}>
                  <FulfillmentList />
                </RoleBasedRoute>
              } />
              <Route path="operations/fulfillment/:id" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "finance", "admin"]}>
                  <FulfillmentDetail />
                </RoleBasedRoute>
              } />
              <Route path="operations/billing" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "finance", "admin"]}>
                  <SubscriptionsList />
                </RoleBasedRoute>
              } />
              
              {/* Invoices */}
              <Route path="invoices" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "finance", "admin"]}>
                  <InvoicesList />
                </RoleBasedRoute>
              } />
              <Route path="invoices/:id" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "finance", "admin", "customer"]}>
                  <InvoiceDetail />
                </RoleBasedRoute>
              } />

              {/* Analytics */}
              <Route path="analytics/deal-health" element={
                <RoleBasedRoute allowedRoles={["sales-rep", "sales-manager", "admin"]}>
                  <DealHealth />
                </RoleBasedRoute>
              } />
              <Route path="analytics/reports" element={
                <RoleBasedRoute allowedRoles={["sales-manager", "admin"]}>
                  <Reports />
                </RoleBasedRoute>
              } />
              
              {/* Approvals */}
              <Route path="approvals" element={
                <RoleBasedRoute allowedRoles={["sales-manager", "finance", "admin"]}>
                  <ApprovalQueue />
                </RoleBasedRoute>
              } />
              
              {/* Customer Portal */}
              <Route path="portal" element={
                <RoleBasedRoute allowedRoles={["customer"]}>
                  <CustomerDashboard />
                </RoleBasedRoute>
              } />
              <Route path="portal/negotiate/:id" element={
                <RoleBasedRoute allowedRoles={["customer"]}>
                  <CustomerNegotiation />
                </RoleBasedRoute>
              } />

              {/* Administration */}
              <Route path="admin/upsell-rules" element={
                <RoleBasedRoute allowedRoles={["admin"]}>
                  <UpsellRules />
                </RoleBasedRoute>
              } />
              <Route path="admin/settings" element={
                <RoleBasedRoute allowedRoles={["admin"]}>
                  <AdminSettings />
                </RoleBasedRoute>
              } />
              <Route path="admin/users" element={
                <RoleBasedRoute allowedRoles={["admin"]}>
                  <Users />
                </RoleBasedRoute>
              } />
              
              {/* Fallback */}
              <Route path="*" element={<Placeholder title="Not Found" description="The page you are looking for does not exist." />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </WorkflowProvider>
  );
}

export default App;
