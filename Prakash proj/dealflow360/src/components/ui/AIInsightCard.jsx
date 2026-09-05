import React from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from './Card';
import { cn } from '../../utils/cn';

export function AIInsightCard({ type, title, explanation, confidence, actionText, onAction, impact, className }) {
  return (
    <Card className={cn("border border-indigo-100 bg-indigo-50/50 shadow-sm overflow-hidden", className)}>
      <div className="bg-indigo-600/10 px-4 py-2 border-b border-indigo-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">AI {type}</span>
        {confidence && (
          <span className="ml-auto text-xs font-medium text-indigo-600 bg-white px-2 py-0.5 rounded-full shadow-sm">
            {confidence}% Match
          </span>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">{title}</h4>
          <p className="text-sm text-slate-600 mt-1">{explanation}</p>
        </div>
        
        {impact && (
          <div className="flex gap-4 text-sm bg-white p-2 rounded border border-indigo-50">
            {impact.revenue && (
              <div>
                <span className="text-slate-500 text-xs block">Expected Revenue</span>
                <span className="font-semibold text-emerald-600">+${impact.revenue.toLocaleString()}</span>
              </div>
            )}
            {impact.margin && (
              <div>
                <span className="text-slate-500 text-xs block">Margin Impact</span>
                <span className="font-semibold text-emerald-600">+${impact.margin.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {actionText && onAction && (
          <button 
            onClick={onAction}
            className="w-full text-center bg-white border border-indigo-200 text-indigo-700 font-medium text-sm py-2 rounded hover:bg-indigo-50 transition-colors"
          >
            {actionText}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
