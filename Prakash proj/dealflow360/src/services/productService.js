import apiClient from "./apiClient";

export const productService = {
  /**
   * Fetch all active products from backend
   */
  getAll: async () => {
    return await apiClient.get("/products");
  },

  /**
   * Fetch a single product by ID
   */
  getById: async (id) => {
    return await apiClient.get(`/products/${id}`);
  },

  /**
   * Create a new product (admin only)
   */
  create: async (productData) => {
    return await apiClient.post("/products", productData);
  },

  /**
   * Update a product (admin only)
   */
  update: async (id, updates) => {
    return await apiClient.put(`/products/${id}`, updates);
  },
};
