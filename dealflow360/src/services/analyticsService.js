import apiClient from "./apiClient";

export const analyticsService = {
  /**
   * Get full dashboard summary: KPIs, pipeline funnel, alerts, deal health
   */
  getDashboard: async () => {
    return await apiClient.get("/analytics/dashboard");
  },

  /**
   * Get deal health analysis for all active quotes
   */
  getDealHealth: async () => {
    return await apiClient.get("/analytics/deal-health");
  },

  /**
   * Get stalled quotes
   */
  getStalledQuotes: async () => {
    return await apiClient.get("/analytics/stalled-quotes");
  },

  /**
   * Get discount anomalies
   */
  getDiscountAnomalies: async () => {
    return await apiClient.get("/analytics/discount-anomalies");
  },
};
