import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { CheckCircle, XCircle, ArrowLeft, ShieldAlert, History, RefreshCw } from "lucide-react";
import { useWorkflow } from "../../context/WorkflowContext";
import { cn } from "../../utils/cn";

export function ApprovalQueue() {
  const { quotations, fetchQuotations, approveQuote, rejectQuote, returnForRevision, loading } = useWorkflow();

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Filter for Approval Queue
  const queue = quotations.filter(q => q.status === "Pending Approval" || q.status === "Approved" || q.status === "Rejected");
  
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = async (id, action) => {
    if (action === "Return") {
      setIsRejecting(id);
      return;
    }
    if (action === "Reject") {
      setIsRejecting(id);
      return;
    }
    // Process Approve
    setActionLoading(true);
    try {
      await approveQuote(id);
      setSelectedQuote(null);
    } finally {
      setActionLoading(false);
    }
  };

  const submitReject = async () => {
    if (!rejectReason) return;
    setActionLoading(true);
    try {
      await rejectQuote(isRejecting, rejectReason);
    } finally {
      setActionLoading(false);
      setIsRejecting(false);
      setSelectedQuote(null);
      setRejectReason("");
    }
  };


  if (selectedQuote) {
    const q = queue.find(item => item.id === selectedQuote);
    if (!q) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedQuote(null)} className="-ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue
          </Button>
          <div className="flex gap-2">
            {q.status === 'Pending Approval' && (
              <>
                <Button variant="outline" className="text-amber-700 border-amber-300 hover:bg-amber-50" onClick={() => handleAction(q.id, "Return")}>
                  Return for Revision
                </Button>
                <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-50" onClick={() => handleAction(q.id, "Reject")}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(q.id, "Approve")}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">Quote Request: {q.id}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Requested by {q.owner || q.requestedBy || "Sales Rep"} on {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : (q.date ? new Date(q.date).toLocaleDateString() : "Recent")}</p>
                  </div>
                  <StatusBadge status={q.status} />
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Customer</span>
                  <span className="font-semibold text-slate-900">{q.customer}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Amount</span>
                  <span className="font-semibold text-slate-900">${q.amount?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Blended Disc.</span>
                  <span className="font-bold text-red-600">{q.discount}%</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Margin</span>
                  <span className="font-semibold text-amber-600">{q.margin}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Risk & Policy Violations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 p-4 rounded-md border border-red-100">
                  <h4 className="font-semibold text-red-800 text-sm mb-1">Hardware Discount Exceeded</h4>
                  <p className="text-xs text-red-700">Requested discount is {q.discount}%. Approval required based on policy limits.</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                  <h4 className="font-semibold text-amber-800 text-sm mb-1">Low Margin Warning</h4>
                  <p className="text-xs text-amber-700">Overall deal margin is {q.margin}%, requiring managerial review.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" />
                  Approval Chain
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-6">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="w-px h-full bg-slate-200 my-1"></div>
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-slate-900">{q.owner || q.requestedBy || "Sales Rep"}</p>
                    <p className="text-xs text-slate-500">Sales Representative</p>
                    <p className="text-xs text-slate-400 mt-1">Submitted {q.createdAt ? new Date(q.createdAt).toLocaleString() : (q.date ? new Date(q.date).toLocaleString() : "Recent")}</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${q.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' : q.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600 animate-pulse'}`}>
                      <div className="h-2 w-2 rounded-full bg-current"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Pending Review</p>
                    <p className="text-xs text-slate-500">{q.level}</p>
                    {q.status === 'Rejected' && <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 p-2 rounded">Rejected: Margin too low</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reject Modal */}
        {isRejecting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Provide Reason</h3>
                <p className="text-sm text-slate-500 mb-4">This reason will be visible to the Sales Representative in the audit trail.</p>
                <textarea
                  className="w-full h-32 rounded-md border border-slate-300 p-3 text-sm focus:border-primary outline-none resize-none"
                  placeholder="Explain why this request is being rejected or returned..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                ></textarea>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
                <Button variant="ghost" onClick={() => { setIsRejecting(false); setRejectReason(""); }}>Cancel</Button>
                <Button className="bg-danger hover:bg-red-600" onClick={submitReject}>Confirm Action</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Approval Queue" 
        description="Review and process requested discounts and custom terms."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Pending" value={queue.filter(q => q.status === 'Pending Approval').length} change="Priority" trend="up" />
        <KpiCard title="High Risk" value={queue.filter(q => (q.riskScore || 0) > 30 && q.status === 'Pending Approval').length} change="Critical" trend="down" />
        <KpiCard title="Approved Today" value={queue.filter(q => q.status === 'Approved').length} change="+2" trend="up" />
        <KpiCard title="Rejected" value={queue.filter(q => q.status === 'Rejected').length} change="0" trend="up" />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Quote ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium text-indigo-600">{quote.id}</TableCell>
                  <TableCell className="font-medium text-slate-900">{quote.customer}</TableCell>
                  <TableCell>${quote.amount?.toLocaleString()}</TableCell>
                  <TableCell className="font-bold text-red-600">{quote.discount || 0}%</TableCell>
                  <TableCell>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-bold", (quote.riskScore || 0) > 30 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                      {quote.riskScore || "Low"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900">{quote.owner || "Sales Rep"}</div>
                    <div className="text-xs text-slate-500">{new Date(quote.createdAt).toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={quote.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedQuote(quote.id)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {queue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    Your queue is empty.
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
