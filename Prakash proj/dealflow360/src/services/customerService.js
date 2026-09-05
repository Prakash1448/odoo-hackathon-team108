import apiClient from "./apiClient";

export const customerService = {
  /**
   * Fetch all customers from backend
   */
  getAll: async () => {
    return await apiClient.get("/customers");
  },

  /**
   * Fetch a single customer by id or name
   */
  getById: async (id) => {
    return await apiClient.get(`/customers/${id}`);
  },
};
