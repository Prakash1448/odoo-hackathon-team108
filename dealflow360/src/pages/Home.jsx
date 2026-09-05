import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Dashboard } from "./Dashboard";

/**
 * Home component - Routes users to appropriate dashboard based on role
 * - Customer: Redirects to /portal
 * - Other roles: Shows Dashboard
 */
export function Home() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect customer role to portal
  if (user.role === "customer") {
    return <Navigate to="/portal" replace />;
  }

  // Other roles see the regular dashboard
  return <Dashboard />;
}
