import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { productService } from "../../services/productService";
import { customerService } from "../../services/customerService";
import { quoteService } from "../../services/quoteService";
import { recommendationService } from "../../services/recommendationService";
import { AIInsightCard } from "../../components/ui/AIInsightCard";
import { generateId } from "../../utils/generateId";
import { ArrowLeft, Plus, Search, Trash2, ShieldAlert } from "lucide-react";
import { cn } from "../../utils/cn";

export function QuotationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;


  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [lines, setLines] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  const [validationError, setValidationError] = useState("");
  const [aiRecommendations, setAiRecommendations] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [fetchedCustomers, fetchedProducts] = await Promise.all([
          customerService.getAll(),
          productService.getAll(),
        ]);
        setCustomers(Array.isArray(fetchedCustomers) ? fetchedCustomers : []);
        setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);

        if (id) {
          // Load existing quote from backend
          try {
            const existingQuote = await quoteService.getById(id);
            if (existingQuote) {
              const matchedCustomer = (Array.isArray(fetchedCustomers) ? fetchedCustomers : []).find(
                c => c.name === existingQuote.customer || c.id === existingQuote.customerId
              ) || null;
              setSelectedCustomer(matchedCustomer);
              // Map backend line items to builder format
              setLines((existingQuote.lines || []).map(l => ({
                id: l.id || generateId('L'),
                product: l.product || { id: l.productId, name: l.productName, price: l.unitPrice, cost: l.unitCost, category: l.category, maxDiscount: 30 },
                quantity: l.quantity,
                discount: l.discount || 0,
              })));
            }
          } catch (err) {
            console.warn("Could not load existing quote:", err.message);
          }
        }
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, [id]);


  // Derived State
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = categoryFilter === "All" || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const summary = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalCost = 0;
    
    lines.forEach(line => {
      const lineSubtotal = line.product.price * line.quantity;
      const lineDiscountAmount = lineSubtotal * (line.discount / 100);
      const lineCost = line.product.cost * line.quantity;
      
      subtotal += lineSubtotal;
      totalDiscount += lineDiscountAmount;
      totalCost += lineCost;
    });

    const finalTotal = subtotal - totalDiscount;
    const marginAmount = finalTotal - totalCost;
    const marginPercentage = finalTotal > 0 ? (marginAmount / finalTotal) * 100 : 0;
    const avgDiscount = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;
    
    return { subtotal, totalDiscount, finalTotal, marginAmount, marginPercentage, avgDiscount };
  }, [lines]);

  // Live recommendations via backend
  useEffect(() => {
    const fetchRecs = async () => {
      if (lines.length > 0) {
        try {
          const items = lines.map(l => ({
            productId: l.product.id,
            quantity: l.quantity,
            unitPrice: l.product.price,
            discount: l.discount,
          }));
          const recs = await recommendationService.getPreviewRecommendations({
            customerId: selectedCustomer?.id,
            items,
          });
          setAiRecommendations(Array.isArray(recs) ? recs : []);
        } catch {
          // Silently fail — recommendations are non-critical
        }
      } else {
        setAiRecommendations([]);
      }
    };
    fetchRecs();
  }, [lines, selectedCustomer]);


  const handleAddProduct = (product) => {
    setLines([...lines, { id: generateId('L'), product, quantity: 1, discount: 0 }]);
  };

  const handleUpdateQuantity = (id, value) => {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
      setValidationError("Quantity must be a positive number.");
      return;
    }
    setValidationError("");
    setLines(lines.map(line => line.id === id ? { ...line, quantity: val } : line));
  };

  const handleUpdateDiscount = (id, value) => {
    const val = parseFloat(value);
    if (isNaN(val) || val < 0 || val > 100) {
      setValidationError("Discount must be between 0 and 100.");
      return;
    }
    setValidationError("");
    setLines(lines.map(line => line.id === id ? { ...line, discount: val } : line));
  };

  const handleRemoveLine = (id) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const handleApplyRecommendation = (rec) => {
    const product = products.find(p => p.id === rec.productRef);
    if (product) {
      handleAddProduct(product);
      setAiRecommendations(prev => prev.filter(r => r.id !== rec.id));
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      setValidationError("Please select a customer.");
      return;
    }
    if (lines.length === 0) {
      setValidationError("Cannot submit an empty quotation.");
      return;
    }
    setValidationError("");
    setSubmitLoading(true);

    try {
      // Build payload with camelCase fields the backend expects
      const payload = {
        id: isEditing ? id : undefined,
        customerId: selectedCustomer.id,
        discount: summary.avgDiscount,
        lines: lines.map(l => ({
          productId: l.product.id,
          quantity: l.quantity,
          discount: l.discount,
        })),
      };

      const saved = await quoteService.createOrUpdate(payload);
      
      if (saved.status === "Pending Approval") {
        console.log("Risk Alert: Quote routed to Manager for approval.");
      }
    } catch (err) {
      setValidationError("Failed to save quote: " + err.message);
      return;
    } finally {
      setSubmitLoading(false);
    }

    navigate("/sales/quotations");
  };


  if (!isDataLoaded) return <div className="p-8 text-center text-slate-500">Loading Config...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 -m-6 md:-m-8">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sales/quotations")} aria-label="Go back">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              {isEditing ? `Quote ${id}` : "New Quotation"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500 font-medium">
                {selectedCustomer ? selectedCustomer.name : "No Customer Selected"}
              </span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                Draft
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSubmit} disabled={submitLoading}>Save Draft</Button>
          <Button 
            disabled={!selectedCustomer || lines.length === 0 || submitLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={handleSubmit}
          >
            {submitLoading ? "Saving..." : "Submit Quotation"}
          </Button>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 overflow-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
          
          <div className="xl:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {!selectedCustomer ? (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Select a Customer</label>
                    <select 
                      className="w-full h-10 rounded-md border border-slate-300 px-3 outline-none focus:ring-1 focus:ring-indigo-500"
                      onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
                      defaultValue=""
                    >
                      <option value="" disabled>Choose...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.tier})</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex justify-between items-start">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm w-full max-w-2xl">
                      <div>
                        <span className="block text-slate-500 mb-1">Company</span>
                        <span className="font-semibold text-slate-900">{selectedCustomer.name}</span>
                        <span className="ml-2 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{selectedCustomer.tier}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 mb-1">Contact</span>
                        <span className="text-slate-900">{selectedCustomer.contact}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)} className="text-slate-500 hover:text-danger">
                      Change
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Quotation Lines</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                {lines.length > 0 ? (
                  <Table className="min-w-[700px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50 text-xs uppercase tracking-wider">
                        <TableHead>Product</TableHead>
                        <TableHead className="w-24">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="w-24 text-right">Disc %</TableHead>
                        <TableHead className="text-right">Final Price</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => {
                        const lineSub = line.product.price * line.quantity;
                        const lineFinal = lineSub * (1 - line.discount / 100);
                        
                        return (
                          <TableRow key={line.id}>
                            <TableCell>
                              <div className="font-medium text-slate-900">{line.product.name}</div>
                              <div className="text-xs text-slate-500">{line.product.category}</div>
                            </TableCell>
                            <TableCell>
                              <input 
                                type="number" 
                                min="1"
                                value={line.quantity} 
                                onChange={(e) => handleUpdateQuantity(line.id, e.target.value)}
                                className="w-full h-8 rounded border border-slate-300 px-2 text-center text-sm outline-none focus:border-indigo-500"
                              />
                            </TableCell>
                            <TableCell className="text-right text-slate-600">${line.product.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <input 
                                type="number" 
                                min="0" max="100"
                                value={line.discount} 
                                onChange={(e) => handleUpdateDiscount(line.id, e.target.value)}
                                className="w-full h-8 rounded border border-slate-300 px-2 text-right text-sm outline-none focus:border-indigo-500"
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-900">${lineFinal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</TableCell>
                            <TableCell className="text-right pr-4">
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveLine(line.id)} className="h-8 w-8 text-slate-400 hover:text-danger" aria-label="Remove item">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Plus className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm">Your quotation is empty. Add products below.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <CardTitle className="text-lg">Product Catalog</CardTitle>
                  <div className="flex gap-2">
                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="h-9 rounded-md border border-slate-300 px-3 text-sm bg-white outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Services">Services</option>
                      <option value="Subscriptions">Subscriptions</option>
                    </select>
                    <div className="relative w-48 sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="h-9 w-full rounded-md border border-slate-300 pl-9 pr-4 text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                <div className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.category}</div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-semibold text-slate-900">${p.price.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">Cost: ${p.cost.toLocaleString()}</div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddProduct(p)}>Add</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {validationError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm flex items-start gap-2 shadow-sm">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600" />
                <span><strong>Validation Error:</strong> {validationError}</span>
              </div>
            )}

            <Card className="bg-slate-900 text-white border-none shadow-xl">
              <CardHeader className="pb-2 border-b border-slate-800">
                <CardTitle className="text-lg">Quotation Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Subtotal</span>
                  <span>${summary.subtotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-400">
                  <span>Total Discount</span>
                  <span>-${summary.totalDiscount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
                <div className="h-px bg-slate-800 my-2"></div>
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>${summary.finalTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-sm text-slate-400">Blended Margin</span>
                  <span className={cn("px-2 py-1 rounded text-xs font-bold", summary.marginPercentage >= 20 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                    {summary.marginPercentage.toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {aiRecommendations.length > 0 && (
              <div className="space-y-4">
                {aiRecommendations.map(rec => (
                  <AIInsightCard 
                    key={rec.id}
                    type={rec.type}
                    title={rec.title}
                    explanation={rec.explanation}
                    confidence={rec.confidence}
                    impact={rec.impact}
                    actionText={rec.recommendedAction}
                    onAction={() => handleApplyRecommendation(rec)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
