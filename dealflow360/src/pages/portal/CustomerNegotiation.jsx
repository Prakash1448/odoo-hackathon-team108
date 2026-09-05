import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { portalService } from "../../services/portalService";
import { CheckCircle, MessageSquare, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import { cn } from "../../utils/cn";

export function CustomerNegotiation() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [proposedDiscount, setProposedDiscount] = useState(0);
  const [showCounter, setShowCounter] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    portalService.getQuoteById(id)
      .then(data => setQuote(data))
      .catch(err => console.error("Portal quote load error:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading quotation...</div>;
  if (!quote) return <div className="p-8 text-center text-slate-500">Quotation not found</div>;

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await portalService.confirmQuote(quote.id);
      alert("Quotation accepted! Your order is now being processed.");
      navigate("/portal");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounter = async () => {
    const val = Number(proposedDiscount);
    if (isNaN(val) || val <= 0 || val >= 100) {
      alert("Please enter a valid discount percentage between 1 and 99.");
      return;
    }
    if (!comment && val <= 0) return;
    setActionLoading(true);
    try {
      await portalService.submitNegotiation(quote.id, { proposedDiscount: val, comment });
      alert("Counter offer submitted.");
      navigate("/portal");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };


  const isSent = quote.status === "Sent";
  const isNegotiating = quote.status === "Under Negotiation" || quote.status === "Pending Approval";
  
  const currentDiscount = quote.discount || 0;
  const originalPrice = quote.subtotal || (currentDiscount > 0 && currentDiscount < 100 ? quote.amount / (1 - (currentDiscount/100)) : quote.amount);
  const proposedPrice = proposedDiscount > 0 ? originalPrice * (1 - (proposedDiscount/100)) : quote.amount;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <PageHeader title={`Quotation ${quote.id}`} description="Review, negotiate, and approve your quote." />
        <Button variant="outline" onClick={() => navigate("/portal")}>Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">${quote.amount?.toLocaleString()}</h2>
                  <p className="text-sm text-slate-500 mt-1">Total investment (includes {currentDiscount}% discount)</p>
                </div>
                <StatusBadge status={quote.status} />
              </div>

              <div className="prose prose-sm max-w-none text-slate-600">
                <p>Thank you for choosing DealFlow360. This quotation is valid until {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}.</p>
                <p><strong>Prepared for:</strong> {quote.customer}</p>
              </div>

              {isSent && (
                <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                  {showCounter ? (
                    <div className="space-y-6">
                      <h3 className="font-semibold text-slate-900 text-lg">Propose Changes</h3>
                      
                      <div className="grid grid-cols-2 gap-6 bg-white p-4 rounded border border-slate-100 shadow-sm">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Requested Discount (%)</label>
                          <input 
                            type="number" 
                            min={currentDiscount} max="100" 
                            value={proposedDiscount} 
                            onChange={(e) => setProposedDiscount(e.target.value)} 
                            className="w-full p-2 border border-slate-300 rounded focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="flex flex-col justify-end pb-2">
                          <p className="text-sm text-slate-500">Proposed New Total:</p>
                          <p className="text-lg font-bold text-indigo-600">${proposedPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      {proposedDiscount > 20 && (
                        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded text-sm border border-amber-200">
                          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
                          <p>Discounts over 20% require additional managerial approval and may delay processing.</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Message to Sales Representative</label>
                        <textarea
                          className="w-full h-32 rounded-md border border-slate-300 p-3 text-sm focus:border-indigo-500 outline-none resize-none"
                          placeholder="Please explain the reasoning for the requested terms..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                      </div>

                      <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setShowCounter(false)}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleCounter}>Submit Counter Offer</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">Ready to proceed?</h3>
                        <p className="text-sm text-slate-500 mt-1">Accepting this quotation will finalize the agreement.</p>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowCounter(true)}>
                          <MessageSquare className="mr-2 h-4 w-4" /> Negotiate Terms
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAccept}>
                          <CheckCircle className="mr-2 h-4 w-4" /> Accept Quotation
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {quote.status === "Confirmed" && (
                <div className="bg-emerald-50 text-emerald-800 p-6 rounded-md flex items-start gap-4 border border-emerald-100">
                  <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900 mb-1">Quotation Accepted</h3>
                    <p className="text-sm mb-4">Your order is currently being processed by our fulfillment team.</p>
                    <div className="flex gap-3">
                      <Button variant="outline" className="bg-white" onClick={() => navigate("/portal")}>View Orders</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                Negotiation Timeline
              </h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-slate-200">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-slate-900 text-sm">Quote Sent</div>
                      <time className="text-xs text-slate-500">{new Date(quote.createdAt).toLocaleDateString()}</time>
                    </div>
                    <div className="text-xs text-slate-500">Initial terms provided.</div>
                  </div>
                </div>

                {quote.negotiationLog && quote.negotiationLog.map((log, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-amber-100 text-amber-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-100 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">{log.sender}</div>
                        <time className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString()}</time>
                      </div>
                      <div className="text-xs text-slate-700">{log.message}</div>
                    </div>
                  </div>
                ))}
                
                {isNegotiating && (
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Clock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-100 bg-slate-50 shadow-sm opacity-60">
                      <div className="font-bold text-slate-900 text-sm mb-1">Awaiting Review</div>
                      <div className="text-xs text-slate-500">Sales team is reviewing your counter proposal.</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
