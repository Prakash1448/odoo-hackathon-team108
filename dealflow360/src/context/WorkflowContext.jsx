import React, { createContext, useContext, useState, useCallback } from "react";
import { quoteService } from "../services/quoteService";
import { approvalService } from "../services/approvalService";
import { fulfillmentService } from "../services/fulfillmentService";
import { billingService } from "../services/billingService";
import { portalService } from "../services/portalService";

const WorkflowContext = createContext(null);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) throw new Error("useWorkflow must be used within WorkflowProvider");
  return context;
};

export const WorkflowProvider = ({ children }) => {
  // ─── local state caches (filled on demand) ─────────────────────────────────
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  // ─── loading / error helpers ────────────────────────────────────────────────
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const setLoadingKey = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));
  const setErrorKey   = (key, val) => setErrors(prev => ({ ...prev, [key]: val }));

  // ═══════════════════════════════════════════════════════════════════════════
  //  QUOTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchQuotations = useCallback(async () => {
    setLoadingKey("quotations", true);
    try {
      const data = await quoteService.getAll();
      setQuotations(Array.isArray(data) ? data : []);
      setErrorKey("quotations", null);
    } catch (err) {
      setErrorKey("quotations", err.message);
    } finally {
      setLoadingKey("quotations", false);
    }
  }, []);

  /**
   * Submit a new or updated quotation for approval.
   * quoteData must include: customerId, lines, discount, etc.
   */
  const submitForApproval = useCallback(async (quoteData) => {
    setLoadingKey("submitting", true);
    try {
      const saved = await quoteService.createOrUpdate({
        ...quoteData,
        status: "Pending Approval",
      });
      // Refresh list
      setQuotations(prev => {
        const exists = prev.find(q => q.id === saved.id);
        return exists
          ? prev.map(q => (q.id === saved.id ? saved : q))
          : [saved, ...prev];
      });
      return saved;
    } catch (err) {
      setErrorKey("submitting", err.message);
      throw err;
    } finally {
      setLoadingKey("submitting", false);
    }
  }, []);

  /**
   * Helper to update quote status (used by pages that call direct status transitions)
   */
  const updateQuoteStatus = useCallback(async (id, newStatus) => {
    const updated = await quoteService.createOrUpdate({ id, status: newStatus });
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, ...updated } : q)));
    return updated;
  }, []);

  const submitToCustomer = useCallback((id) => updateQuoteStatus(id, "Sent"), [updateQuoteStatus]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  APPROVALS
  // ═══════════════════════════════════════════════════════════════════════════

  const approveQuote = useCallback(async (id, comments = "") => {
    const result = await approvalService.approve(id, comments);
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, status: "Approved" } : q)));
    return result;
  }, []);

  const rejectQuote = useCallback(async (id, reason = "") => {
    const result = await approvalService.reject(id, reason);
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, status: "Draft", rejectionReason: reason } : q)));
    return result;
  }, []);

  const returnForRevision = useCallback(async (id, reason = "") => {
    const result = await approvalService.returnForRevision(id, reason);
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, status: "Draft", rejectionReason: reason } : q)));
    return result;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  CUSTOMER PORTAL ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const customerAcceptQuote = useCallback(async (id) => {
    const result = await portalService.confirmQuote(id);
    setQuotations(prev => prev.map(q => (q.id === id ? { ...q, status: "Confirmed" } : q)));
    // Refresh orders after confirmation — backend creates the order automatically
    fetchOrders();
    return result;
  }, []);

  const customerCounterOffer = useCallback(async (id, proposedDiscount, comment) => {
    const result = await portalService.submitNegotiation(id, { proposedDiscount, comment });
    // Refresh to pick up new status & negotiation log
    fetchQuotations();
    return result;
  }, [fetchQuotations]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  FULFILLMENT / ORDERS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchOrders = useCallback(async () => {
    setLoadingKey("orders", true);
    try {
      const data = await fulfillmentService.getAll();
      setOrders(Array.isArray(data) ? data : []);
      setErrorKey("orders", null);
    } catch (err) {
      setErrorKey("orders", err.message);
    } finally {
      setLoadingKey("orders", false);
    }
  }, []);

  const allocateWarehouseSplit = useCallback(async (orderId, splits) => {
    const result = await fulfillmentService.applyManualSplit(orderId, splits);
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: "Warehouse Allocation", splits } : o)));
    return result;
  }, []);

  const fulfillOrder = useCallback(async (orderId) => {
    const result = await fulfillmentService.shipOrder(orderId);
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: "Shipped" } : o)));
    // Refresh invoices & subscriptions — backend auto-generates them on ship
    fetchInvoices();
    fetchSubscriptions();
    return result;
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  BILLING — INVOICES
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchInvoices = useCallback(async () => {
    setLoadingKey("invoices", true);
    try {
      const data = await billingService.getInvoices();
      setInvoices(Array.isArray(data) ? data : []);
      setErrorKey("invoices", null);
    } catch (err) {
      setErrorKey("invoices", err.message);
    } finally {
      setLoadingKey("invoices", false);
    }
  }, []);

  const payInvoice = useCallback(async (invoiceId) => {
    await billingService.payInvoice(invoiceId);
    setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? { ...inv, status: "Paid" } : inv)));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  BILLING — SUBSCRIPTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchSubscriptions = useCallback(async () => {
    setLoadingKey("subscriptions", true);
    try {
      const data = await billingService.getSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : []);
      setErrorKey("subscriptions", null);
    } catch (err) {
      setErrorKey("subscriptions", err.message);
    } finally {
      setLoadingKey("subscriptions", false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <WorkflowContext.Provider value={{
      // State
      quotations, setQuotations,
      orders, setOrders,
      invoices, setInvoices,
      subscriptions, setSubscriptions,
      loading,
      errors,

      // Fetch actions
      fetchQuotations,
      fetchOrders,
      fetchInvoices,
      fetchSubscriptions,

      // Quote actions
      submitForApproval,
      updateQuoteStatus,
      submitToCustomer,

      // Approval actions
      approveQuote,
      rejectQuote,
      returnForRevision,

      // Customer portal
      customerAcceptQuote,
      customerCounterOffer,

      // Fulfillment
      allocateWarehouseSplit,
      fulfillOrder,

      // Billing
      payInvoice,
    }}>
      {children}
    </WorkflowContext.Provider>
  );
};
