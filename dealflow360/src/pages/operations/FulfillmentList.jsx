import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { useWorkflow } from "../../context/WorkflowContext";

export function FulfillmentList() {
  const navigate = useNavigate();
  const { orders, fetchOrders, loading } = useWorkflow();

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Warehouse Fulfillment" description="Manage approved orders and shipments." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Quote Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-slate-900">{order.id}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{order.quoteId}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Processing' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/operations/fulfillment/${order.id}`)}>
                      Process Order
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No orders pending fulfillment.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
