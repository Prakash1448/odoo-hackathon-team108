import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
          <span className="text-3xl">🛑</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Access Denied</h1>
        <p className="text-base text-slate-500 mb-8">
          You do not have the required permissions to view this page. Please contact your system administrator if you believe this is an error.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
          <Link to="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
