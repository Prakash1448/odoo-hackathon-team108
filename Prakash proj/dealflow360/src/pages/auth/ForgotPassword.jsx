import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function ForgotPassword() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Forgot Password</h2>
          <p className="text-sm text-slate-500 mt-2">Enter your email and we'll send you a link to reset your password.</p>
        </div>
        
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <Button className="w-full" size="lg">Send Reset Link</Button>
        </form>
        
        <p className="text-center text-sm text-slate-500 mt-6">
          <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
