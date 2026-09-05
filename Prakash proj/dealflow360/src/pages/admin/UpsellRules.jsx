import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";
import apiClient from "../../services/apiClient";

export function UpsellRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/admin/rules");
      setRules(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const toggleActive = async (id) => {
    try {
      const res = await apiClient.put(`/admin/rules/${id}/toggle`);
      setRules(rules.map(r => r.id === id ? { ...r, active: res.active } : r));
    } catch (err) {
      alert("Failed to toggle rule: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Intelligence Rules Engine" 
        description="Manage the AI recommendation rules for upsell and cross-sell suggestions in MySQL Database."
      >
        <Button variant="outline" size="sm" onClick={fetchRules} disabled={loading} className="mr-2">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button><Plus className="mr-2 h-4 w-4" /> Create Rule</Button>
      </PageHeader>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Trigger Product</TableHead>
                <TableHead>Recommended Product</TableHead>
                <TableHead>Rule Type</TableHead>
                <TableHead>Min Margin</TableHead>
                <TableHead>Promotion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-slate-900">{rule.triggerProduct}</TableCell>
                  <TableCell className="text-indigo-600 font-medium">{rule.recProduct}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${rule.type === 'Upsell' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {rule.type}
                    </span>
                  </TableCell>
                  <TableCell>{rule.minMargin}%</TableCell>
                  <TableCell>
                    {rule.isPromo ? (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">Promo</span>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => toggleActive(rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${rule.active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <span className="sr-only">Toggle rule</span>
                      <span aria-hidden="true" className="pointer-events-none absolute h-full w-full rounded-md bg-white"></span>
                      <span aria-hidden="true" className={`pointer-events-none absolute mx-auto h-4 w-4 rounded-full bg-white shadow ring-1 ring-black/5 transition duration-200 ease-in-out ${rule.active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    {error ? `Error: ${error}` : "No intelligence rules configured."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
