import React, { useState, useEffect } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/Table";
import { StatusBadge } from "../components/ui/StatusBadge";
import { KpiCard } from "../components/dashboard/KpiCard";
import { useAuth } from "../context/AuthContext";
import { useWorkflow } from "../context/WorkflowContext";
import { analyticsService } from "../services/analyticsService";
import { Bell, Sparkles, AlertTriangle, FileText, TrendingUp, Plus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quotations, fetchQuotations } = useWorkflow();

  const [dashboardData, setDashboardData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const loadDashboard = async () => {
    setDashLoading(true);
    try {
      const [dash] = await Promise.all([
        analyticsService.getDashboard(),
        fetchQuotations(),
      ]);
      setDashboardData(dash);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const kpis = dashboardData?.kpis || {};
  const alerts = dashboardData?.alerts || [];
  const dealHealth = dashboardData?.dealHealth || [];
  const pipelineFunnel = dashboardData?.pipelineFunnel || [];
  const intelligence = dashboardData?.intelligence || [];
  const recentQuotes = quotations.slice(0, 4);

  if (dashLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentDate = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  }).format(new Date());

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="mt-1 text-slate-500">
            Here's what's happening with your pipeline today. &mdash; {currentDate}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/sales/pipeline')}><TrendingUp className="mr-2 h-4 w-4" /> View Pipeline</Button>
          <Button onClick={() => navigate('/sales/quotations/build')}><Plus className="mr-2 h-4 w-4" /> Create Quotation</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Total Quotation Value" value={kpis.totalQuotationValue?.value || "$0"} change={kpis.totalQuotationValue?.change || "0%"} trend={kpis.totalQuotationValue?.trend || "up"} />
        <KpiCard title="Active Quotations" value={kpis.activeQuotations?.value || "0"} change={kpis.activeQuotations?.change || "+0"} trend={kpis.activeQuotations?.trend || "up"} />
        <KpiCard title="Pending Approvals" value={kpis.pendingApprovals?.value || "0"} change={kpis.pendingApprovals?.change || "0"} trend={kpis.pendingApprovals?.trend || "down"} />
        <KpiCard title="Expected Revenue" value={kpis.expectedRevenue?.value || "$0"} change={kpis.expectedRevenue?.change || "0%"} trend={kpis.expectedRevenue?.trend || "up"} />
        <KpiCard title="Average Margin" value={kpis.averageMargin?.value || "0%"} change={kpis.averageMargin?.change || "0%"} trend={kpis.averageMargin?.trend || "down"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Pipeline Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Pipeline Summary</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="flex h-24 items-end gap-2 mt-4">
                {pipelineFunnel.map((stage, idx) => {
                  const maxCount = Math.max(...pipelineFunnel.map(s => s.count));
                  const heightPercentage = (stage.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex flex-1 flex-col justify-end items-center group relative cursor-pointer">
                      <div className="absolute -top-10 hidden group-hover:block bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                        {stage.value}
                      </div>
                      <span className="text-xs font-semibold mb-2">{stage.count}</span>
                      <div 
                        className="w-full bg-indigo-100 rounded-t-md group-hover:bg-indigo-200 transition-colors"
                        style={{ height: `${Math.max(heightPercentage, 10)}%` }}
                      >
                        <div className="h-1 w-full bg-indigo-600 rounded-t-md"></div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500 mt-2 truncate w-full text-center">
                        {stage.stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Quotations Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Quotations</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Quote</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQuotes.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell className="font-medium text-indigo-600">{quote.id}</TableCell>
                      <TableCell>{quote.customer}</TableCell>
                      <TableCell>${quote.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={quote.margin < 20 ? "text-danger font-medium" : "text-emerald-600 font-medium"}>
                          {quote.margin}%
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={quote.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area (Right column) */}
        <div className="space-y-8">
          
          {/* Intelligence Section */}
          <Card className="border-indigo-100 bg-indigo-50/50 shadow-indigo-100/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles className="h-5 w-5" />
                <CardTitle className="text-lg">Deal Intelligence</CardTitle>
              </div>
              <p className="text-xs text-indigo-600/70 mt-1">2 opportunities detected</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {intelligence.map((item) => (
                <div key={item.id} className="rounded-lg bg-white p-3 shadow-sm border border-indigo-100 text-sm">
                  <div className="font-medium text-slate-900">{item.customer}</div>
                  <div className="text-indigo-600 font-medium mt-1">{item.recommendation}</div>
                  <div className="flex justify-between items-center mt-2 text-xs">
                    <span className="text-slate-500">Value: <span className="font-semibold text-slate-700">{item.expectedValue}</span></span>
                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Margin: {item.marginImpact}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600">
                  <Bell className="h-5 w-5" />
                  <CardTitle className="text-lg text-slate-900">Action Required</CardTitle>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">2</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border border-slate-200 p-3 hover:border-amber-300 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-sm text-slate-900">{alert.quote}</div>
                    <span className="text-xs font-medium text-danger bg-red-50 px-1.5 py-0.5 rounded">Risk: {alert.risk}</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{alert.customer} - {alert.discount} Discount</div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    <span className="font-medium">{alert.action}</span>
                    <span className="ml-auto text-indigo-600 hover:underline">Review &rarr;</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Deal Health Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Deal Health</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dealHealth.map((health) => (
                <div key={health.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${health.severity === 'danger' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{health.customer}</div>
                    <div className="text-xs text-slate-500">{health.quote} &bull; <span className="text-slate-700">{health.issue}</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
