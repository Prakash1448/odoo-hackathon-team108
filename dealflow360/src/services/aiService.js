// This mock service simulates a future FastAPI AI endpoint
export const aiService = {
  // 1. Discount Risk Prediction
  evaluateDiscountRisk: async (quoteAmount, discountPercent) => {
    // Mock latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (discountPercent > 20) {
      return {
        type: "DiscountRisk",
        score: 85, // out of 100
        level: "High",
        isApprovalRequired: true,
        reasons: [
          "Discount exceeds normal customer range (max 15%)",
          "Margin drops below required profitability threshold"
        ],
        action: "Managerial Approval Required"
      };
    }
    
    if (discountPercent > 10) {
      return {
        type: "DiscountRisk",
        score: 45,
        level: "Moderate",
        isApprovalRequired: false,
        reasons: ["Discount is slightly higher than category average."],
        action: "Proceed with caution"
      };
    }

    return {
      type: "DiscountRisk",
      score: 10,
      level: "Low",
      isApprovalRequired: false,
      reasons: ["Standard pricing rules applied."],
      action: "Safe to proceed"
    };
  },

  // 2. Cross-sell / Upsell Recommendations
  getRecommendations: async (cartItems) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const recommendations = [];

    const hasHardware = cartItems.some(i => i.product.category === "Hardware");
    if (hasHardware) {
      recommendations.push({
        id: "rec-ai-1",
        type: "Cross-sell",
        title: "Premium Support Plan",
        explanation: "Customers purchasing this hardware frequently purchase Premium Support.",
        confidence: 87,
        impact: { revenue: 12000, margin: 8000 },
        recommendedAction: "Add to Quote",
        productRef: "p-4" // Assuming p-4 is a support subscription
      });
    }

    return recommendations;
  },

  // 3. Deal Health Anomaly Detection
  getDealHealth: async (quoteId, quoteData) => {
    // Mock logic based on deal properties
    const daysInactive = quoteData.lastActivity ? Math.floor((Date.now() - new Date(quoteData.lastActivity).getTime()) / (1000 * 3600 * 24)) : 0;
    
    if (daysInactive > 14 || quoteData.discount > 25) {
      return {
        overall: "Critical",
        commercialScore: 40,
        approvalScore: quoteData.status === "Pending Approval" ? 30 : 90,
        engagementScore: 20,
        factors: [
          "No customer activity for over 14 days.",
          "High discount requested threatens margin."
        ],
        recommendedActions: ["Nudge Customer", "Escalate to Director"]
      };
    }
    
    return {
      overall: "Healthy",
      commercialScore: 85,
      approvalScore: 100,
      engagementScore: 90,
      factors: ["Active engagement", "Standard pricing"],
      recommendedActions: ["Continue standard follow-up"]
    };
  }
};
