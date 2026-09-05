import React from "react";
import { cn } from "../../utils/cn";

export function PageHeader({ title, description, children, className }) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between pb-6", className)}>
      <div className="space-y-1 mb-4 md:mb-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {children}
      </div>
    </div>
  );
}
