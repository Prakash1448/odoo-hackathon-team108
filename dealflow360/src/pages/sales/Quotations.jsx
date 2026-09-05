import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useWorkflow } from "../../context/WorkflowContext";
import { Plus, Search, Filter, ArrowUpDown, MoreHorizontal, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";

export function Quotations() {
  const { quotations, fetchQuotations, loading } = useWorkflow();

  useEffect(() => {
    fetchQuotations();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredQuotes = quotations.filter(q => {
    const matchesSearch = q.customer.toLowerCase().includes(searchTerm.toLowerCase()) || q.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case "high": return "text-danger bg-red-50 ring-red-600/10";
      case "medium": return "text-amber-700 bg-amber-50 ring-amber-600/20";
      case "low": return "text-emerald-700 bg-emerald-50 ring-emerald-600/20";
      default: return "text-slate-600 bg-slate-50 ring-slate-500/10";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Quotations" 
        description="Manage and track all customer quotations and proposals."
      >
        <Button variant="outline" size="sm" onClick={fetchQuotations} disabled={loading.quotations}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading.quotations && "animate-spin")} />
          {loading.quotations ? "Loading..." : "Refresh"}
        </Button>
        <Button onClick={() => window.location.href = '/sales/quotations/build'}><Plus className="mr-2 h-4 w-4" /> Create Quotation</Button>
      </PageHeader>

      {/* Mini KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: quotations.length },
          { label: "Draft", value: quotations.filter(q => q.status === "Draft").length },
          { label: "Pending Approval", value: quotations.filter(q => q.status === "Pending Approval").length },
          { label: "Negotiation", value: quotations.filter(q => q.status === "Under Negotiation").length },
          { label: "Confirmed", value: quotations.filter(q => q.status === "Confirmed").length },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex flex-col justify-center items-center text-center">
              <span className="text-2xl font-bold text-slate-900">{kpi.value}</span>
              <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-slate-200 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotes or customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-1"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-300 px-3 text-sm bg-white outline-none focus:border-primary"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Sent">Sent</option>
              <option value="Under Negotiation">Under Negotiation</option>
              <option value="Confirmed">Confirmed</option>
            </select>
            <Button variant="outline" size="sm" className="shrink-0"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
            <Button variant="outline" size="sm" className="shrink-0"><ArrowUpDown className="mr-2 h-4 w-4" /> Sort</Button>
          </div>
        </div>

        {/* Table */}
        {filteredQuotes.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead>Quote ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium text-indigo-600">{quote.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{quote.customer}</div>
                      <div className="text-xs text-slate-500">{quote.owner}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${quote.amount.toLocaleString()}</div>
                      <div className="text-xs text-slate-500">{quote.discount}% discount</div>
                    </TableCell>
                    <TableCell>
                      <span className={quote.margin < 20 ? "text-danger font-medium" : "text-emerald-600 font-medium"}>
                        {quote.margin}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", getRiskColor(quote.risk))}>
                        {quote.risk}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={quote.status} /></TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No quotations found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
            <Button variant="outline" className="mt-4" onClick={() => { setSearchTerm(""); setStatusFilter("All"); }}>Clear Filters</Button>
          </div>
        )}

        {/* Pagination Placeholder */}
        {filteredQuotes.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 p-4">
            <div className="text-sm text-slate-500">
              Showing 1 to {filteredQuotes.length} of {filteredQuotes.length} results
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
