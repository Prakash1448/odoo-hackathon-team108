import apiClient from "./apiClient";

export const billingService = {
  // ==================== INVOICES ====================

  /**
   * Fetch all invoices (filtered by role in backend)
   */
  getInvoices: async () => {
    return await apiClient.get("/invoices");
  },

  /**
   * Fetch a single invoice by ID
   */
  getInvoiceById: async (id) => {
    return await apiClient.get(`/invoices/${id}`);
  },

  /**
   * Mark an invoice as paid
   */
  payInvoice: async (id) => {
    return await apiClient.post(`/invoices/${id}/pay`);
  },

  // ==================== SUBSCRIPTIONS ====================

  /**
   * Fetch all subscriptions (filtered by role in backend)
   */
  getSubscriptions: async () => {
    return await apiClient.get("/subscriptions");
  },

  /**
   * Modify subscription quantity — backend handles proration calculation
   */
  modifySubscription: async (id, quantity) => {
    return await apiClient.post(`/subscriptions/${id}/modify`, { quantity });
  },

  /**
   * Cancel a subscription
   */
  cancelSubscription: async (id) => {
    return await apiClient.post(`/subscriptions/${id}/cancel`);
  },
};
