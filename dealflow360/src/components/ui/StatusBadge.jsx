import React from "react";
import { cn } from "../../utils/cn";

export function StatusBadge({ status, className }) {
  const variants = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
    danger: "bg-red-50 text-red-700 ring-red-600/10",
    info: "bg-blue-50 text-blue-700 ring-blue-700/10",
    neutral: "bg-slate-50 text-slate-600 ring-slate-500/10",
  };

  const getVariant = (s) => {
    switch (s?.toLowerCase()) {
      case "active":
      case "approved":
      case "completed":
        return variants.success;
      case "pending":
      case "review":
        return variants.warning;
      case "rejected":
      case "failed":
        return variants.danger;
      case "draft":
      case "processing":
        return variants.info;
      default:
        return variants.neutral;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
        getVariant(status),
        className
      )}
    >
      {status}
    </span>
  );
}
