export const mockDashboardData = {
  kpis: {
    totalQuotationValue: { value: "$3.2M", change: "+12.5%", trend: "up" },
    activeQuotations: { value: "48", change: "+4", trend: "up" },
    pendingApprovals: { value: "12", change: "-2", trend: "down" },
    expectedRevenue: { value: "$1.8M", change: "+8.2%", trend: "up" },
    averageMargin: { value: "32.4%", change: "-1.2%", trend: "down" }
  },
  alerts: [
    {
      id: "alert-1",
      quote: "QT-2026-0042",
      customer: "Acme Corp",
      discount: "25%",
      risk: "High",
      requiredApprover: "Sarah Jenkins",
      action: "Needs Discount Approval"
    },
    {
      id: "alert-2",
      quote: "QT-2026-0045",
      customer: "Global Tech",
      discount: "10%",
      risk: "Low",
      requiredApprover: "Marcus Thorne",
      action: "Needs Payment Terms Approval"
    }
  ],
  intelligence: [
    {
      id: "int-1",
      customer: "CyberSystems Inc.",
      recommendation: "Upsell Premium Support Tier",
      expectedValue: "+$12,000",
      marginImpact: "+4%"
    },
    {
      id: "int-2",
      customer: "LogisFleet",
      recommendation: "Cross-sell Analytics Module",
      expectedValue: "+$25,000",
      marginImpact: "+2.5%"
    }
  ],
  dealHealth: [
    { id: "dh-1", quote: "QT-2026-0012", customer: "Starlight Media", issue: "Stalled > 14 days", severity: "warning" },
    { id: "dh-2", quote: "QT-2026-0038", customer: "Oceanic Trading", issue: "Margin below 20%", severity: "danger" }
  ],
  pipelineFunnel: [
    { stage: "Draft", count: 15, value: "$450k" },
    { stage: "Pending Approval", count: 12, value: "$800k" },
    { stage: "Sent", count: 8, value: "$520k" },
    { stage: "Negotiation", count: 5, value: "$630k" },
    { stage: "Confirmed", count: 8, value: "$800k" }
  ]
};
