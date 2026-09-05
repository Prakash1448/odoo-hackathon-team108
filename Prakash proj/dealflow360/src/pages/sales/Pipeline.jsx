import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Plus, Clock, AlertTriangle } from "lucide-react";
import { useWorkflow } from "../../context/WorkflowContext";
import { cn } from "../../utils/cn";

const COLUMNS = [
  "Draft",
  "Pending Approval",
  "Sent",
  "Under Negotiation",
  "Confirmed",
  "Fulfillment",
  "Completed"
];

export function Pipeline() {
  const { quotations, fetchQuotations, updateQuoteStatus } = useWorkflow();

  useEffect(() => {
    fetchQuotations();
  }, []);

  const [columns, setColumns] = useState(() => {
    return COLUMNS.reduce((acc, col) => ({ ...acc, [col]: [] }), {});
  });

  useEffect(() => {
    const grouped = COLUMNS.reduce((acc, col) => ({ ...acc, [col]: [] }), {});
    quotations.forEach(quote => {
      if (grouped[quote.status]) {
        grouped[quote.status].push(quote);
      } else {
        grouped["Draft"].push(quote);
      }
    });
    setColumns(grouped);
  }, [quotations]);

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColumn = [...(columns[source.droppableId] || [])];
    const destColumn = source.droppableId === destination.droppableId ? sourceColumn : [...(columns[destination.droppableId] || [])];
    
    const [removed] = sourceColumn.splice(source.index, 1);
    const updatedItem = { ...removed, status: destination.droppableId };
    
    destColumn.splice(destination.index, 0, updatedItem);

    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    });

    // Persist status change to MySQL database via API
    try {
      await updateQuoteStatus(removed.id, destination.droppableId);
    } catch (err) {
      console.error("Failed to update quote status:", err);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <PageHeader 
        title="Sales Pipeline" 
        description="Track and progress deals through the sales cycle."
        className="shrink-0"
      >
        <Button><Plus className="mr-2 h-4 w-4" /> Create Quotation</Button>
      </PageHeader>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex h-full items-start gap-4 inline-flex px-1 min-h-[500px]">
            {COLUMNS.map(columnId => (
              <div key={columnId} className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-slate-100/50 p-3">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-semibold text-slate-700 text-sm">{columnId}</h3>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                    {columns[columnId].length}
                  </span>
                </div>
                
                <Droppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 overflow-y-auto space-y-3 rounded-md transition-colors",
                        snapshot.isDraggingOver ? "bg-slate-200/50" : ""
                      )}
                    >
                      {columns[columnId].map((quote, index) => (
                        <Draggable key={quote.id} draggableId={quote.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md",
                                snapshot.isDragging ? "rotate-2 shadow-lg ring-1 ring-primary" : ""
                              )}
                              style={provided.draggableProps.style}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-indigo-600">{quote.id}</span>
                                {quote.risk.toLowerCase() === 'high' && (
                                  <AlertTriangle className="h-4 w-4 text-danger" />
                                )}
                              </div>
                              <h4 className="font-semibold text-slate-900 leading-tight mb-1">{quote.customer}</h4>
                              <div className="text-lg font-bold text-slate-900 my-2">${quote.amount.toLocaleString()}</div>
                              
                              <div className="flex items-center gap-2 mt-3 text-xs">
                                <span className={cn("px-2 py-0.5 rounded border font-medium", getRiskColor(quote.risk))}>
                                  Risk: {quote.risk}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded border font-medium", 
                                  quote.margin < 20 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-600 border-slate-200"
                                )}>
                                  Margin: {quote.margin}%
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(quote.updatedAt).toLocaleDateString()}</span>
                                <div className="ml-auto flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600" title={quote.owner}>
                                  {quote.owner.charAt(0)}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
