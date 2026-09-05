import apiClient from "./apiClient";

export const recommendationService = {
  /**
   * Get live upsell/cross-sell recommendations for an unsaved in-progress quote.
   * items: Array<{ productId, quantity, unitPrice, discount }>
   */
  getPreviewRecommendations: async ({ customerId, items }) => {
    return await apiClient.post("/recommendations/preview", {
      customerId,
      items,
    });
  },
};
