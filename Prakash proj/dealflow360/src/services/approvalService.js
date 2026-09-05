import apiClient from "./apiClient";

export const approvalService = {
  /**
   * Fetch all quotes in the approval queue
   */
  getQueue: async () => {
    return await apiClient.get("/approvals");
  },

  /**
   * Approve a quote
   */
  approve: async (id, comments = "") => {
    return await apiClient.post(`/approvals/${id}/approve`, { comments });
  },

  /**
   * Reject a quote with a reason
   */
  reject: async (id, reason = "") => {
    return await apiClient.post(`/approvals/${id}/reject`, { reason });
  },

  /**
   * Return a quote for revision
   */
  returnForRevision: async (id, reason = "") => {
    return await apiClient.post(`/approvals/${id}/return`, { reason });
  },
};
