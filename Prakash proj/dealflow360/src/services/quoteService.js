import apiClient from "./apiClient";

export const quoteService = {
  /**
   * Fetch all quotations from backend
   */
  getAll: async () => {
    return await apiClient.get("/quotes");
  },

  /**
   * Fetch a single quotation by ID
   */
  getById: async (id) => {
    return await apiClient.get(`/quotes/${id}`);
  },

  /**
   * Create or update a quotation.
   * The backend upserts based on whether an id is provided.
   */
  createOrUpdate: async (quoteData) => {
    return await apiClient.post("/quotes", quoteData);
  },

  /**
   * Live risk evaluation for QuotationBuilder (unsaved quote)
   */
  evaluateRiskPreview: async ({ amount, discount, customerId }) => {
    return await apiClient.post("/quotes/risk-preview", {
      amount,
      discount,
      customerId,
    });
  },
};
