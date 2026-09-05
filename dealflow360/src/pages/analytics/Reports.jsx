import React, { useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { useWorkflow } from "../../context/WorkflowContext";
import { BarChart3, TrendingUp, DollarSign, Percent, RefreshCw } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Reports() {
  const { quotations, orders, fetchQuotations, fetchOrders, loading } = useWorkflow();

  useEffect(() => {
    fetchQuotations();
    fetchOrders();
  }, []);

  const totalQuoteValue = quotations.reduce((sum, q) => sum + (q.amount || 0), 0);
  const confirmedRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const conversionRate = quotations.length > 0 ? (orders.length / quotations.length) * 100 : 0;
  
  const totalDiscount = quotations.reduce((sum, q) => sum + (q.discount || 0), 0);
  const avgDiscount = quotations.length > 0 ? (totalDiscount / quotations.length) : 0;

  // Compute dynamic Sales Rep Performance from live MySQL database quotations
  const repPerformanceMap = {};
  quotations.forEach(q => {
    const ownerName = q.owner || "Sales Rep";
    if (!repPerformanceMap[ownerName]) {
      repPerformanceMap[ownerName] = {
        name: ownerName,
        quotes: 0,
        value: 0,
        confirmed: 0,
        revenue: 0,
        totalDiscount: 0,
        totalMargin: 0
      };
    }
    const rep = repPerformanceMap[ownerName];
    rep.quotes += 1;
    rep.value += (q.amount || 0);
    rep.totalDiscount += (q.discount || 0);
    rep.totalMargin += (q.margin || 0);

    if (q.status === "Confirmed" || q.status === "Fulfillment") {
      rep.confirmed += 1;
      rep.revenue += (q.amount || 0);
    }
  });

  const repPerformance = Object.values(repPerformanceMap).map(rep => ({
    name: rep.name,
    quotes: rep.quotes,
    value: rep.value,
    confirmed: rep.confirmed,
    revenue: rep.revenue,
    avgDiscount: rep.quotes > 0 ? (rep.totalDiscount / rep.quotes).toFixed(1) : "0",
    margin: rep.quotes > 0 ? (rep.totalMargin / rep.quotes).toFixed(1) : "0",
    winRate: rep.quotes > 0 ? Math.round((rep.confirmed / rep.quotes) * 100) : 0
  }));

  // Dynamic monthly trend calculation from MySQL database records
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = {};

  quotations.forEach(q => {
    const d = q.createdAt ? new Date(q.createdAt) : new Date();
    const monthKey = monthNames[d.getMonth()];
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { name: monthKey, revenue: 0, pipeline: 0, totalMargin: 0, totalDiscount: 0, count: 0 };
    }
    monthlyData[monthKey].pipeline += (q.amount || 0);
    monthlyData[monthKey].totalMargin += (q.margin || 0);
    monthlyData[monthKey].totalDiscount += (q.discount || 0);
    monthlyData[monthKey].count += 1;

    if (q.status === "Confirmed" || q.status === "Fulfillment") {
      monthlyData[monthKey].revenue += (q.amount || 0);
    }
  });

  orders.forEach(o => {
    const d = o.createdAt ? new Date(o.createdAt) : new Date();
    const monthKey = monthNames[d.getMonth()];
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { name: monthKey, revenue: 0, pipeline: 0, totalMargin: 0, totalDiscount: 0, count: 0 };
    }
    monthlyData[monthKey].revenue += (o.amount || 0);
  });

  const monthsOrdered = monthNames.filter(m => monthlyData[m]);
  const revenueTrendData = monthsOrdered.map(m => ({
    name: m,
    revenue: monthlyData[m].revenue,
    pipeline: monthlyData[m].pipeline
  }));

  const marginDiscountData = monthsOrdered.map(m => ({
    name: m,
    margin: monthlyData[m].count > 0 ? Math.round(monthlyData[m].totalMargin / monthlyData[m].count) : 0,
    discount: monthlyData[m].count > 0 ? Math.round(monthlyData[m].totalDiscount / monthlyData[m].count) : 0
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <PageHeader title="Sales Operations Reporting" description="Comprehensive analytics on deal velocity, margin, and team performance." />
        <div className="flex gap-2 text-sm text-slate-500">
          <select className="border-slate-300 rounded p-2 border outline-none"><option>This Quarter</option></select>
          <select className="border-slate-300 rounded p-2 border outline-none"><option>All Teams</option></select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Pipeline Value" value={`$${totalQuoteValue.toLocaleString()}`} change="Active Quotes" trend="up" />
        <KpiCard title="Confirmed Revenue" value={`$${confirmedRevenue.toLocaleString()}`} change="Secured" trend="up" />
        <KpiCard title="Conversion Rate" value={`${conversionRate.toFixed(1)}%`} change="Win rate" trend={conversionRate > 30 ? "up" : "down"} />
        <KpiCard title="Average Discount" value={`${avgDiscount.toFixed(1)}%`} change="Across all quotes" trend={avgDiscount > 15 ? "down" : "up"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Revenue & Conversion Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 p-4 pt-6 border-t border-slate-100 bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  tickFormatter={(val) => `$${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="pipeline" name="Pipeline Value" fill="#c7d2fe" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="revenue" name="Confirmed Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-500" />
              Discount & Margin Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 p-4 pt-6 border-t border-slate-100 bg-white">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginDiscountData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}%`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="margin" name="Avg Margin" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="discount" name="Avg Discount" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sales Representative Performance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sales Rep</TableHead>
                <TableHead className="text-center">Quotes</TableHead>
                <TableHead className="text-right">Pipeline Value</TableHead>
                <TableHead className="text-center">Won</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-center">Avg Discount</TableHead>
                <TableHead className="text-center">Avg Margin</TableHead>
                <TableHead className="text-center">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repPerformance.map((rep, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-slate-900">{rep.name}</TableCell>
                  <TableCell className="text-center">{rep.quotes}</TableCell>
                  <TableCell className="text-right">${rep.value.toLocaleString()}</TableCell>
                  <TableCell className="text-center font-semibold text-emerald-600">{rep.confirmed}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">${rep.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-amber-600">{rep.avgDiscount}%</TableCell>
                  <TableCell className="text-center">{rep.margin}%</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${rep.winRate >= 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {rep.winRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
