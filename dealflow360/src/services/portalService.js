import apiClient from "./apiClient";

export const portalService = {
  /**
   * Get all quotes visible to the logged-in customer
   */
  getQuotes: async () => {
    return await apiClient.get("/portal/quotes");
  },

  /**
   * Get a single quote detail for the customer portal
   */
  getQuoteById: async (id) => {
    return await apiClient.get(`/portal/quotes/${id}`);
  },

  /**
   * Submit a counter-offer / negotiation message
   */
  submitNegotiation: async (id, { proposedDiscount, comment }) => {
    return await apiClient.post(`/portal/quotes/${id}/negotiate`, {
      proposedDiscount,
      comment,
    });
  },

  /**
   * Customer accepts and confirms the quote
   */
  confirmQuote: async (id) => {
    return await apiClient.post(`/portal/quotes/${id}/confirm`);
  },

  /**
   * Get all invoices for the logged-in customer
   */
  getInvoices: async () => {
    return await apiClient.get("/portal/invoices");
  },

  /**
   * Get a single invoice detail for the customer portal
   */
  getInvoiceById: async (id) => {
    return await apiClient.get(`/portal/invoices/${id}`);
  },

  /**
   * Mark invoice as paid
   */
  payInvoice: async (id) => {
    return await apiClient.post(`/portal/invoices/${id}/pay`);
  },

  /**
   * Create an order request (draft quote) for the customer
   */
  createOrderRequest: async (items) => {
    return await apiClient.post("/portal/requests", { items });
  },

  /**
   * Get all order requests (draft quotes) created by the customer
   */
  getOrderRequests: async () => {
    return await apiClient.get("/portal/requests");
  },
};
