import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { analyticsService } from "../../services/analyticsService";
import { AlertTriangle, TrendingDown, Activity, Bell } from "lucide-react";
import { cn } from "../../utils/cn";

export function DealHealth() {
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getDealHealth()
      .then(data => setHealthData(Array.isArray(data) ? data : []))
      .catch(err => console.error("Deal health error:", err))
      .finally(() => setLoading(false));

  }, []);

  const handleNudge = (id) => {
    alert(`Nudge sent to customer for Deal ${id}. Activity logged.`);
  };

  if (loading) return <div className="p-8 text-center">Loading AI Deal Analysis...</div>;

  const criticalDeals = healthData.filter(d => d.health.overall === "Critical");
  const healthyDeals = healthData.filter(d => d.health.overall === "Healthy");

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Deal Health & Anomalies" 
        description="AI-driven insights identifying risky, stalled, and unusual pipeline behavior." 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard title="Healthy Deals" value={healthyDeals.length} change="On Track" trend="up" />
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-red-600 mb-1">Critical Risk Deals</p>
            <h3 className="text-3xl font-bold text-red-900">{criticalDeals.length}</h3>
            <p className="text-xs text-red-700 mt-2 flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Immediate action required</p>
          </CardContent>
        </Card>
        <KpiCard title="Avg Engagement Score" value="72/100" change="-5%" trend="down" />
        <KpiCard title="Discount Risk Exposure" value="$42,000" change="At risk margin" trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Stalled & High Risk Deals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {criticalDeals.map(deal => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium text-indigo-600">{deal.id}</TableCell>
                    <TableCell>{deal.customer}</TableCell>
                    <TableCell>${deal.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">{deal.health.overall}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleNudge(deal.id)}>
                        <Bell className="w-3 h-3 mr-1" /> Nudge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {criticalDeals.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">No critical deals detected.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Discount Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-center">Current %</TableHead>
                  <TableHead className="text-center">Diff vs Avg</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthData.filter(d => (d.discount || 0) > 15).map(deal => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.owner || "Alex Sterling"}</TableCell>
                    <TableCell className="text-sm">{deal.customer}</TableCell>
                    <TableCell className="text-center font-bold text-red-600">{deal.discount || 0}%</TableCell>
                    <TableCell className="text-center text-red-600 text-xs font-medium">+{deal.discount - 10}%</TableCell>
                    <TableCell><span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded">Under Review</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
