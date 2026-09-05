import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { useWorkflow } from "../../context/WorkflowContext";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { KpiCard } from "../../components/dashboard/KpiCard";
import { CalendarDays, AlertTriangle } from "lucide-react";
import { billingService } from "../../services/billingService";

export function SubscriptionsList() {
  const { subscriptions, setSubscriptions, fetchSubscriptions } = useWorkflow();
  const [selectedSub, setSelectedSub] = useState(null);
  const [isModifying, setIsModifying] = useState(false);
  const [newQty, setNewQty] = useState(1);
  const [isCancelling, setIsCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);


  const handleModify = (sub) => {
    setSelectedSub(sub);
    setNewQty(sub.quantity);
    setIsModifying(true);
  };

  const handleCancel = (sub) => {
    setSelectedSub(sub);
    setIsCancelling(true);
  };

  const submitModification = async () => {
    setActionLoading(true);
    try {
      const updated = await billingService.modifySubscription(selectedSub.id, newQty);
      setSubscriptions(prev => prev.map(s => s.id === selectedSub.id ? updated : s));
      alert("Subscription modified and prorated invoice generated.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
      setIsModifying(false);
      setSelectedSub(null);
    }
  };

  const submitCancellation = async () => {
    setActionLoading(true);
    try {
      await billingService.cancelSubscription(selectedSub.id);
      setSubscriptions(prev => prev.map(s => s.id === selectedSub.id ? { ...s, status: "Cancelled" } : s));
      alert("Subscription cancelled successfully.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
      setIsCancelling(false);
      setSelectedSub(null);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions & Billing" description="Manage active customer subscriptions, renewals, and modifications." />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Active Subs" value={subscriptions.filter(s=>s.status==='Active').length} change="+1" trend="up" />
        <KpiCard title="Pending" value="0" change="Steady" trend="up" />
        <KpiCard title="Expiring Soon" value="0" change="Needs attention" trend="down" />
        <KpiCard title="Cancelled" value={subscriptions.filter(s=>s.status==='Cancelled').length} change="This month" trend="down" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sub ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Next Billing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="font-medium text-indigo-600">{sub.id}</TableCell>
                  <TableCell>{sub.customer}</TableCell>
                  <TableCell>{sub.plan}</TableCell>
                  <TableCell>{sub.quantity}</TableCell>
                  <TableCell>${sub.amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(sub.nextBillingDate).toLocaleDateString()}</TableCell>
                  <TableCell><StatusBadge status={sub.status} /></TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    {sub.status === 'Active' && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleModify(sub)}>Modify</Button>
                        <Button variant="outline" size="sm" className="text-danger border-red-200 hover:bg-red-50" onClick={() => handleCancel(sub)}>Cancel</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {subscriptions.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">No subscriptions active.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modification Modal */}
      {isModifying && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Modify Subscription</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">New Quantity</p>
                  <input type="number" min="1" value={newQty} onChange={e => setNewQty(Number(e.target.value))} className="w-full border rounded p-2" />
                </div>
                
                <div className="bg-slate-50 p-4 rounded-md border border-slate-100 text-sm space-y-2">
                  <div className="flex justify-between text-slate-500">
                    <span>Current Amount</span>
                    <span>${selectedSub.amount}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>New Subscription Amount</span>
                    <span>${(selectedSub.amount / selectedSub.quantity) * newQty}</span>
                  </div>
                  <div className="flex justify-between text-indigo-600 pt-2 border-t border-slate-200">
                    <span>Prorated Adjustment (Estimated)</span>
                    <span>+${(((selectedSub.amount / selectedSub.quantity) * newQty) - selectedSub.amount) / 2}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setIsModifying(false)}>Discard</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={submitModification}>Confirm Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {isCancelling && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-red-500">
            <div className="p-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">Cancel Subscription?</h3>
              <p className="text-sm text-slate-500">This will immediately terminate the subscription for <strong>{selectedSub.plan}</strong>.</p>
              <div className="bg-red-50 p-3 rounded text-red-800 text-sm font-medium">
                Final billing impact: No refund issued for remaining cycle.
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-between gap-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsCancelling(false)}>Keep Active</Button>
              <Button className="bg-danger hover:bg-red-700" onClick={submitCancellation}>Confirm Cancellation</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
