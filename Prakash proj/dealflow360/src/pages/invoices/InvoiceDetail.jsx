import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { billingService } from "../../services/billingService";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { CheckCircle, Printer, Download, CreditCard, ChevronRight, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";

export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    billingService.getInvoiceById(id)
      .then(data => setInvoice(data))
      .catch(err => console.error("Invoice load error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePay = async () => {
    setPayLoading(true);
    try {
      await billingService.payInvoice(id);
      setInvoice(prev => ({ ...prev, status: "Paid" }));
    } catch (err) {
      alert("Payment failed: " + err.message);
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500"><RefreshCw className="animate-spin mx-auto mb-2 h-6 w-6" />Loading invoice...</div>;
  if (!invoice) return <div className="p-8 text-center text-slate-500">Invoice not found</div>;

  const isPaid = invoice.status === "Paid";

  const subtotal = invoice.subtotal || invoice.amount;
  const tax = invoice.tax || subtotal * 0.08;
  const total = invoice.amount || (subtotal + tax);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <PageHeader title={`Invoice ${invoice.id}`} description={`Issued to ${invoice.customer}`} />
        <div className="flex gap-2">
          <Button variant="outline"><Printer className="w-4 h-4 mr-2" /> Print</Button>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> PDF</Button>
          <Button variant="ghost" onClick={() => navigate("/invoices")}>Back to List</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="overflow-hidden border-t-4 border-indigo-600">
            <CardContent className="p-8">
              <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">DealFlow360</h1>
                  <p className="text-slate-500 text-sm mt-1">123 Business Road, Tech City, CA 90210</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-slate-900 uppercase tracking-widest text-indigo-600 mb-2">Invoice</h2>
                  <StatusBadge status={invoice.status} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                  <p className="font-semibold text-slate-900">{invoice.customer}</p>
                  <p className="text-slate-500 text-sm">Finance Department<br/>100 Enterprise Way<br/>New York, NY 10001</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Invoice Number</h3>
                    <p className="font-medium text-slate-900">{invoice.id}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Reference</h3>
                    <p className="font-medium text-slate-900">{invoice.orderId || invoice.quoteId}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Issue Date</h3>
                    <p className="font-medium text-slate-900">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Due Date</h3>
                    <p className="font-medium text-slate-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items && invoice.items.length > 0 ? invoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 font-medium text-slate-900">{item.description || "Service Item"}</td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">${item.unitPrice?.toLocaleString() || 0}</td>
                        <td className="px-4 py-3 text-right font-medium">${item.amount?.toLocaleString() || 0}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-4 py-3 font-medium text-slate-900">Custom Order Items</td>
                        <td className="px-4 py-3 text-center">1</td>
                        <td className="px-4 py-3 text-right">${subtotal.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">${subtotal.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Tax (8%)</span>
                    <span>${tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Due</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar / Payment Actions */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Payment Status</h3>
              {isPaid ? (
                <div className="bg-emerald-50 text-emerald-800 p-4 rounded-lg flex items-start gap-3 border border-emerald-100">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Paid in Full</p>
                    <p className="text-sm mt-1 text-emerald-700">Payment received on {new Date().toLocaleDateString()}. Thank you for your business.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-lg border border-amber-100">
                    <p className="font-bold mb-1">Awaiting Payment</p>
                    <p className="text-sm text-amber-700">Due by {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-base shadow-md"
                    disabled={payLoading}
                    onClick={handlePay}
                  >
                    <CreditCard className="w-5 h-5 mr-2" /> {payLoading ? "Processing..." : "Mark as Paid"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Related Documents</h3>
              {invoice.orderId && (
                <Button variant="outline" className="w-full justify-between" onClick={() => navigate(`/operations/fulfillment/${invoice.orderId}`)}>
                  View Order <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
              )}
              {invoice.quoteId && (
                <Button variant="outline" className="w-full justify-between" onClick={() => navigate(`/sales/quotations/build/${invoice.quoteId}`)}>
                  View Quote <ChevronRight className="w-4 h-4 text-slate-400" />
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
