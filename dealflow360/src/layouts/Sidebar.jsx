import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  Box, 
  CreditCard, 
  Activity, 
  BarChart, 
  Settings, 
  Users,
  PackageSearch,
  CheckCircle,
  Home
} from "lucide-react";
import { cn } from "../utils/cn";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["sales-rep", "sales-manager", "finance", "admin"] },
  { name: "Portal", href: "/portal", icon: Home, roles: ["customer"] },
  { 
    name: "Sales", 
    roles: ["sales-rep", "sales-manager", "admin"],
    items: [
      { name: "Quotations", href: "/sales/quotations", icon: FileText, roles: ["sales-rep", "sales-manager", "admin"] },
      { name: "Pipeline", href: "/sales/pipeline", icon: TrendingUp, roles: ["sales-rep", "admin"] },
    ]
  },
  { 
    name: "Operations", 
    roles: ["sales-rep", "finance", "admin"],
    items: [
      { name: "Fulfillment", href: "/operations/fulfillment", icon: Box, roles: ["sales-rep", "finance", "admin"] },
      { name: "Billing", href: "/operations/billing", icon: CreditCard, roles: ["sales-rep", "finance", "admin"] },
    ]
  },
  { 
    name: "Analytics", 
    roles: ["sales-rep", "sales-manager", "admin"],
    items: [
      { name: "Deal Health", href: "/analytics/deal-health", icon: Activity, roles: ["sales-rep", "sales-manager", "admin"] },
      { name: "Reports", href: "/analytics/reports", icon: BarChart, roles: ["sales-manager", "admin"] },
    ]
  },
  {
    name: "Queue",
    roles: ["sales-manager", "finance", "admin"],
    items: [
      { name: "Approvals", href: "/approvals", icon: CheckCircle, roles: ["sales-manager", "finance", "admin"] },
    ]
  },
  {
    name: "Administration",
    roles: ["admin"],
    items: [
      { name: "Upsell Rules", href: "/admin/upsell-rules", icon: PackageSearch, roles: ["admin"] },
      { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
      { name: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
    ]
  }
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-white transition-all">
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
            <span className="text-white">D</span>
          </div>
          DealFlow<span className="text-primary-light">360</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-4">
          {navigation.map((section) => {
            if (section.items) {
              const visibleItems = section.items;
              if (visibleItems.length === 0) return null;
              
              return (
                <div key={section.name}>
                  <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    {section.name}
                  </h3>
                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={cn(
                            "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isActive 
                              ? "bg-indigo-600 text-white" 
                              : "text-slate-300 hover:bg-slate-800 hover:text-white"
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // Single item sections
            return (
              <div key={section.name}>
                <Link
                  to={section.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === section.href
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  {section.name}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
