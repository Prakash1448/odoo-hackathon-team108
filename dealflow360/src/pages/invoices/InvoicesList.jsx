import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { useWorkflow } from "../../context/WorkflowContext";

export function InvoicesList() {
  const navigate = useNavigate();
  const { invoices, payInvoice, fetchInvoices, loading } = useWorkflow();

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage customer billing and payments." />
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Order Ref</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-indigo-600">{inv.id}</TableCell>
                  <TableCell className="text-slate-500 text-xs">{inv.orderId}</TableCell>
                  <TableCell>{inv.customer}</TableCell>
                  <TableCell>${inv.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'Unpaid' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {inv.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/invoices/${inv.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No invoices generated yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
