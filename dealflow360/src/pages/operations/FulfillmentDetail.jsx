import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { fulfillmentService } from "../../services/fulfillmentService";
import { Package, Truck, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";

export function FulfillmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocationMode, setAllocationMode] = useState(false);
  const [splits, setSplits] = useState({});
  const [splitError, setSplitError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [autoSplitData, setAutoSplitData] = useState(null);

  const loadOrder = () => {
    setLoading(true);
    fulfillmentService.getById(id)
      .then(data => setOrder(data))
      .catch(err => console.error("Fulfillment load error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500"><RefreshCw className="animate-spin mx-auto mb-2 h-6 w-6" />Loading order...</div>;
  if (!order) return <div className="p-8 text-center text-slate-500">Order not found</div>;

  const handleStartAllocation = async () => {
    setActionLoading(true);
    try {
      // Get backend-recommended auto-split
      const data = await fulfillmentService.getAutoSplit(order.id);
      setAutoSplitData(data);
      // Pre-fill splits from recommended
      const recommended = {};
      if (data.recommendedSplits) {
        Object.entries(data.recommendedSplits).forEach(([productId, whData]) => {
          recommended[productId] = whData;
        });
      } else {
        // Fallback: use current order items
        (order.items || []).forEach(item => {
          if (item.category === "Services" || item.category === "Subscriptions") return;
          recommended[item.productId] = { "Warehouse A": item.quantity };
        });
      }
      setSplits(recommended);
      setAllocationMode(true);
    } catch (err) {
      setSplitError("Could not fetch allocation suggestions: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSplit = (productId, wh, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setSplits(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [wh]: numValue
      }
    }));
  };

  const submitAllocation = async () => {
    const finalSplits = [];
    let totalAllocated = 0;

    Object.entries(splits).forEach(([productId, whData]) => {
      Object.entries(whData).forEach(([wh, qty]) => {
        if (qty > 0) {
          finalSplits.push({ productId, warehouse: wh, quantity: qty });
          totalAllocated += qty;
        }
      });
    });

    if (totalAllocated === 0) {
      setSplitError("Must allocate at least one item.");
      return;
    }

    setSplitError("");
    setActionLoading(true);
    try {
      await fulfillmentService.applyManualSplit(order.id, finalSplits);
      alert("Warehouse split confirmed. Ready for shipment.");
      setAllocationMode(false);
      loadOrder();
    } catch (err) {
      setSplitError("Allocation failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };


  const steps = ["Order Confirmed", "Processing", "Warehouse Allocation", "Partially Fulfilled", "Shipped", "Delivered"];
  let currentStepIndex = steps.indexOf(order.status);
  if (currentStepIndex === -1) {
    if (order.status === "Fulfilled") currentStepIndex = 4;
    else currentStepIndex = 1;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <PageHeader title={`Order Fulfillment: ${order.id}`} description={`Processing order for ${order.customer}`} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/sales/quotations/build/${order.quoteId}`)}>View Quote</Button>
          <Button variant="outline" onClick={() => navigate("/operations/fulfillment")}>Back to List</Button>
        </div>
      </div>

      {/* Progress Tracker */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2"></div>
            <div 
              className="absolute left-0 top-1/2 h-1 bg-emerald-500 -z-10 -translate-y-1/2 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            ></div>
            
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step} className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white transition-colors",
                    isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400",
                    isCurrent ? "ring-emerald-100" : ""
                  )}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                  </div>
                  <span className={cn(
                    "text-xs font-medium max-w-[80px] text-center",
                    isCurrent ? "text-emerald-700 font-bold" : (isCompleted ? "text-slate-700" : "text-slate-400")
                  )}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items & Allocation */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-500" />
                Order Items & Inventory
              </CardTitle>
              {order.status === 'Processing' && !allocationMode && (
                <Button onClick={handleStartAllocation}>Start Warehouse Allocation</Button>
              )}
            </CardHeader>
            <CardContent>
              {splitError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded text-sm mb-4 border border-red-200">
                  <strong>Validation Error:</strong> {splitError}
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Requested</TableHead>
                    <TableHead className="text-center">Stock Available</TableHead>
                    <TableHead className="text-center">Allocated</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items && order.items.map((item, idx) => {
                    const isPhysical = item.product?.category === "Hardware" || item.category === "Hardware";
                    const inv = (autoSplitData?.availableStock && autoSplitData.availableStock[item.productId || item.product?.id]) || { "Warehouse A": 10, "Warehouse B": 10 };
                    const totalStock = inv["Warehouse A"] + inv["Warehouse B"];
                    const needsBackorder = isPhysical && totalStock < item.quantity;
                    
                    const allocatedTotal = order.splits 
                      ? order.splits.filter(s => s.productId === item.product.id).reduce((sum, s) => sum + s.quantity, 0)
                      : 0;

                    return (
                      <React.Fragment key={idx}>
                        <TableRow className={needsBackorder && order.status === 'Processing' ? "bg-red-50/50" : ""}>
                          <TableCell>
                            <div className="font-medium text-slate-900">{item.product.name}</div>
                            <div className="text-xs text-slate-500">{item.product.category}</div>
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-900">{item.quantity}</TableCell>
                          <TableCell className="text-center">
                            {isPhysical ? (
                              <span className={totalStock < item.quantity ? "text-danger font-semibold" : "text-emerald-600 font-semibold"}>
                                {totalStock}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Digital / N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {isPhysical ? (order.status !== 'Processing' ? allocatedTotal : "-") : item.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {!isPhysical ? (
                              <StatusBadge status="Digital Delivery" />
                            ) : (
                              needsBackorder && order.status === 'Processing' ? (
                                <StatusBadge status="Backorder Risk" className="bg-red-100 text-red-700 border-red-200" />
                              ) : order.status === 'Warehouse Allocation' ? (
                                <StatusBadge status="Allocated" />
                              ) : (
                                <StatusBadge status="Pending Split" />
                              )
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Allocation Mode Dropdown Row */}
                        {allocationMode && isPhysical && (
                          <TableRow className="bg-slate-50">
                            <TableCell colSpan={5} className="p-4">
                              <div className="bg-white border border-slate-200 rounded-md p-4">
                                <h4 className="text-sm font-semibold text-slate-900 mb-3">Warehouse Split Configuration</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {["Warehouse A", "Warehouse B"].map(wh => {
                                    const stock = inv[wh];
                                    const val = (splits[item.product.id] && splits[item.product.id][wh]) || 0;
                                    return (
                                      <div key={wh} className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                                        <div>
                                          <div className="text-sm font-medium">{wh}</div>
                                          <div className="text-xs text-slate-500">Stock: {stock}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <input 
                                            type="number" 
                                            min="0"
                                            max={stock}
                                            value={val}
                                            onChange={(e) => handleUpdateSplit(item.product.id, wh, e.target.value)}
                                            className="w-16 h-8 text-center border border-slate-300 rounded focus:border-indigo-500 outline-none"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {(() => {
                                  const totalAssigned = Object.values(splits[item.product.id] || {}).reduce((a,b) => a+b, 0);
                                  const remaining = item.quantity - totalAssigned;
                                  if (remaining > 0) {
                                    return (
                                      <div className="mt-3 flex items-center gap-2 text-danger bg-red-50 p-2 rounded border border-red-100 text-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        <strong>Backorder Required:</strong> {remaining} units cannot be fulfilled from current stock.
                                      </div>
                                    );
                                  }
                                  if (totalAssigned > item.quantity) {
                                    return (
                                      <div className="mt-3 text-danger text-sm font-semibold">Error: Allocation ({totalAssigned}) exceeds requested ({item.quantity}).</div>
                                    );
                                  }
                                  return (
                                    <div className="mt-3 text-emerald-600 text-sm font-semibold flex items-center gap-2">
                                      <CheckCircle className="h-4 w-4" /> Fully Allocated
                                    </div>
                                  );
                                })()}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              
              {allocationMode && (
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setAllocationMode(false)}>Cancel</Button>
                  <Button onClick={submitAllocation} className="bg-indigo-600 hover:bg-indigo-700">Confirm Warehouse Split</Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-500" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              <div>
                <span className="block text-slate-500 mb-1">Expected Delivery</span>
                <span className="font-semibold text-slate-900">
                  {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Shipping Method</span>
                <span className="text-slate-900">Priority Freight</span>
              </div>
              <div>
                <span className="block text-slate-500 mb-1">Delivery Status</span>
                <span className="text-slate-900">{order.status === 'Processing' ? 'Awaiting Allocation' : 'Allocated - Preparing Shipment'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Next Steps</h3>
              {order.status === 'Warehouse Allocation' || order.status === 'Partially Fulfilled' ? (
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={actionLoading}
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      await fulfillmentService.shipOrder(order.id);
                      alert("Order Shipped! Invoice and subscriptions have been generated.");
                      navigate("/operations/fulfillment");
                    } catch (err) {
                      alert("Ship failed: " + err.message);
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                >
                  {actionLoading ? "Processing..." : "Confirm Shipment"}
                </Button>
              ) : (
                <p className="text-xs text-slate-500 text-center">Allocate warehouse inventory to proceed to shipment.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
