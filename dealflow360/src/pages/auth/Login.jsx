import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/Button";

// Demo credentials matching the database seed
const DEMO_USERS = [
  { id: "u-1", email: "alex.sterling@dealflow.com", roleName: "Sales Representative", role: "sales-rep" },
  { id: "u-2", email: "sarah.jenkins@dealflow.com", roleName: "Sales Manager", role: "sales-manager" },
  { id: "u-3", email: "marcus.thorne@dealflow.com", roleName: "Finance Manager", role: "finance" },
  { id: "u-4", email: "elena.admin@dealflow.com", roleName: "System Administrator", role: "admin" },
  { id: "u-5", email: "john@acmecorp.com", roleName: "Customer (Acme Corp)", role: "customer" },
];

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleLogin = async (e, demoEmail = null) => {
    if (e) e.preventDefault();
    
    setError("");
    setIsLoading(true);

    const loginEmail = demoEmail || email;
    const loginPassword = demoEmail ? "password" : password;

    if (!loginEmail) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    const response = await login(loginEmail, loginPassword);
    
    if (response.success) {
      let target = from;
      if (target === '/unauthorized' || target === '/login') {
        target = '/';
      }
      
      // Use role from JWT response
      if (response.user?.role === 'customer' && target === '/') {
        target = '/portal';
      }
      
      navigate(target, { replace: true });
    } else {
      setError(response.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-slate-900 p-12 text-white">
        <div>
          <div className="flex items-center gap-2 font-bold text-2xl tracking-tight mb-8">
            <div className="h-10 w-10 rounded bg-primary flex items-center justify-center">
              <span className="text-white">D</span>
            </div>
            DealFlow<span className="text-primary-light">360</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mt-12 mb-6">
            Intelligent sales operations for modern enterprise.
          </h1>
          <p className="text-lg text-slate-300 max-w-md">
            Streamline quotations, manage approvals, and track deal health all in one self-governing platform.
          </p>
        </div>
        <div className="text-sm text-slate-500">
          © {new Date().getFullYear()} DealFlow360. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 md:p-12 lg:p-24 bg-slate-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">
              Please enter your details to sign in.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                  placeholder="name@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-hover">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 mb-4 text-center">Or continue with demo roles</h3>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map(user => (
                <Button 
                  key={user.id} 
                  variant="outline" 
                  onClick={() => handleLogin(null, user.email)}
                  disabled={isLoading}
                  className="w-full justify-start text-left font-normal"
                >
                  <span className="font-medium mr-2">{user.roleName}</span>
                  <span className="text-slate-400 text-xs truncate">({user.email})</span>
                </Button>
              ))}
            </div>
          </div>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold leading-6 text-primary hover:text-primary-hover">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
