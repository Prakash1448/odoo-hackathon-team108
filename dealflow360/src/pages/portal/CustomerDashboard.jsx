import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { portalService } from "../../services/portalService";

export function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [myQuotes, setMyQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalService.getQuotes()
      .then(data => setMyQuotes(Array.isArray(data) ? data : []))
      .catch(err => console.error("Portal load error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader 
        title={`Welcome back, ${user.company || "Customer"}`} 
        description="Review your active quotations and manage your subscriptions." 
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Quotations</h2>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myQuotes.map(quote => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium text-indigo-600">{quote.id}</TableCell>
                  <TableCell className="text-sm text-slate-500">{new Date(quote.date || quote.createdAt).toLocaleDateString()}</TableCell>
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
              {myQuotes.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">You have no active quotations.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
