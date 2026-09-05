import React from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { Card, CardContent } from "../components/ui/Card";

export function Placeholder({ title, description = "This module is currently under development." }) {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader title={title} description={description} />
      
      <Card className="flex-1 min-h-[400px]">
        <CardContent className="flex h-full items-center justify-center flex-col text-slate-400 p-12">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-slate-300">?</span>
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-2">{title} Module</h3>
          <p className="text-center max-w-md">{description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
