import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { portalService } from "../../services/portalService";
import { Plus, FileText, ShoppingCart, RefreshCw, AlertTriangle, Truck } from "lucide-react";
import apiClient from "../../services/apiClient";

export function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myQuotes, setMyQuotes] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [confirmedOrders, setConfirmedOrders] = useState([]);
  const [orderBackorderStatus, setOrderBackorderStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [quotes, requests] = await Promise.all([
        portalService.getQuotes(),
        portalService.getOrderRequests(),
      ]);
      
      setMyQuotes(Array.isArray(quotes) ? quotes : []);
      setMyRequests(Array.isArray(requests) ? requests : []);
      
      // Find confirmed quotes and fetch their order status
      const confirmed = Array.isArray(quotes) ? quotes.filter(q => q.status === "Confirmed") : [];
      setConfirmedOrders(confirmed);
      
      // Fetch backorder status for each confirmed order
      if (confirmed.length > 0) {
        const statusMap = {};
        for (const quote of confirmed) {
          try {
            // Try to fetch order status - the order ID is derived from quote ID
            const orderIdDerived = `ORD-${quote.id.replace('QT-', '').replace('quote-', '')}`;
            const status = await apiClient.get(`/portal/order-status/${orderIdDerived}`);
            statusMap[quote.id] = status;
          } catch (err) {
            // If order not found, just continue
            console.error(`Could not fetch backorder status for order:`, err);
          }
        }
        setOrderBackorderStatus(statusMap);
      }
    } catch (err) {
      console.error("Portal load error:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getBackorderBadge = (quoteId) => {
    const status = orderBackorderStatus[quoteId];
    if (!status) return null;
    
    if (status.hasBackorder) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">Backorder</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <PageHeader 
          title={`Welcome back, ${user.company || "Customer"}`} 
          description="Manage your quotations, order requests, and invoices." 
        />
        <Button onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-700 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/portal/requests/create")}>
          <CardContent className="p-6 text-center">
            <ShoppingCart className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900">Create Order Request</h3>
            <p className="text-sm text-slate-500 mt-1">Tell us what you need</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/portal/invoices")}>
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-900">View Invoices</h3>
            <p className="text-sm text-slate-500 mt-1">See your billing history</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center gap-4">
              <div>
                <div className="text-2xl font-bold text-slate-900">{myQuotes.length}</div>
                <p className="text-sm text-slate-500">Quotations</p>
              </div>
              <div className="border-l"></div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{myRequests.length}</div>
                <p className="text-sm text-slate-500">Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmed Orders with Backorder Status */}
      {confirmedOrders.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Your Orders
            </h2>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-indigo-600">{order.id}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">${order.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                        Confirmed
                      </span>
                    </TableCell>
                    <TableCell>
                      {orderBackorderStatus[order.id] && orderBackorderStatus[order.id].hasBackorder ? (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-medium text-amber-700">Backorder</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">In stock</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => navigate(`/portal/invoices`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Order Requests Section */}
      {myRequests.length > 0 && (
        <Card>
          <div className="border-b border-slate-100 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              Your Order Requests
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/portal/requests/create")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Request
            </Button>
          </div>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.map(request => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium text-indigo-600">{request.id}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(request.date || request.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {request.items?.length || 0} {request.items?.length === 1 ? "item" : "items"}
                    </TableCell>
                    <TableCell className="font-semibold">${request.amount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={() => navigate(`/portal/negotiate/${request.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quotations Section */}
      <Card>
        <div className="border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Your Quotations
          </h2>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myQuotes
                .filter(q => q.status !== "Draft" && q.status !== "Confirmed") // Don't show draft or confirmed here
                .map(quote => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium text-indigo-600">{quote.id}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(quote.date || quote.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {quote.items?.length || 0} {quote.items?.length === 1 ? "item" : "items"}
                    </TableCell>
                    <TableCell className="font-semibold">${quote.amount?.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={quote.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant={quote.status === "Sent" ? "default" : "outline"}
                        size="sm" 
                        onClick={() => navigate(`/portal/negotiate/${quote.id}`)}
                      >
                        {quote.status === "Sent" ? "Review Quote" : "View Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              {myQuotes.filter(q => q.status !== "Draft" && q.status !== "Confirmed").length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    You have no pending quotations. <br />
                    <Button 
                      variant="link" 
                      onClick={() => navigate("/portal/requests/create")}
                      className="mt-2"
                    >
                      Create an order request
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
