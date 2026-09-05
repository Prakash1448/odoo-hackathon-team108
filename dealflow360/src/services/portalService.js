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
};
