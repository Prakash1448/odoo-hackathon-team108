import React from "react";
import { Card, CardContent } from "../ui/Card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "../../utils/cn";

export function KpiCard({ title, value, change, trend }) {
  const isUp = trend === "up";
  
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
          <span className={cn(
            "flex items-center text-xs font-medium",
            isUp ? "text-emerald-600" : "text-danger"
          )}>
            {isUp ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
