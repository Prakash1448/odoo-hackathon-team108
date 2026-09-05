import apiClient from "./apiClient";

export const fulfillmentService = {
  /**
   * Fetch all fulfillment orders
   */
  getAll: async () => {
    return await apiClient.get("/fulfillment");
  },

  /**
   * Fetch a single order detail by ID
   */
  getById: async (id) => {
    return await apiClient.get(`/fulfillment/${id}`);
  },

  /**
   * Get auto-computed warehouse split suggestions for an order
   */
  getAutoSplit: async (id) => {
    return await apiClient.get(`/fulfillment/${id}/auto-split`);
  },

  /**
   * Apply auto-computed warehouse allocation
   */
  applyAutoSplit: async (id) => {
    return await apiClient.post(`/fulfillment/${id}/allocate`);
  },

  /**
   * Apply a manual warehouse split override
   * splits: Array<{ productId, warehouse, quantity }>
   */
  applyManualSplit: async (id, splits) => {
    return await apiClient.post(`/fulfillment/${id}/manual-allocation`, { splits });
  },

  /**
   * Ship an order — triggers invoice + subscription generation in backend
   */
  shipOrder: async (id) => {
    return await apiClient.post(`/fulfillment/${id}/ship`);
  },
};
