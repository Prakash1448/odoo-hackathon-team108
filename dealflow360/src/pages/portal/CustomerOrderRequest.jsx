import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { portalService } from "../../services/portalService";
import { productService } from "../../services/productService";
import { ArrowLeft, Plus, Trash2, Send } from "lucide-react";

/**
 * CustomerOrderRequest - Allow customers to create purchase order requests
 * These get created as Draft quotes which sales reps can review and convert to formal quotes
 */
export function CustomerOrderRequest() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        productId: products[0]?.id || "",
        quantity: 1,
        product: products[0] || null,
      },
    ]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    if (field === "productId") {
      const product = products.find(p => p.id === value);
      newItems[index].productId = value;
      newItems[index].product = product;
    } else if (field === "quantity") {
      newItems[index].quantity = parseInt(value) || 1;
    }
    setItems(newItems);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (items.length === 0) {
      setError("Please add at least one product to your request");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const requestData = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      await portalService.createOrderRequest(requestData);
      
      // Success - navigate back to portal
      navigate("/portal");
    } catch (err) {
      console.error("Failed to create order request:", err);
      setError(err.message || "Failed to create order request");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const price = item.product?.price || 0;
      return sum + price * item.quantity;
    }, 0);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading products...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/portal")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <PageHeader
        title="Create Order Request"
        description="Tell us what products you'd like to order. Our sales team will review your request and send you a quotation."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-700 text-sm">
              {error}
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <p className="text-slate-600 mb-4">No products added yet</p>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600">
                        Price
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600">
                        Subtotal
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(index, "productId", e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          >
                            <option value="">Select a product</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.category})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {item.product ? `$${item.product.price.toLocaleString()}` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                            className="w-20 px-3 py-2 border border-slate-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                          />
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          ${(
                            (item.product?.price || 0) * item.quantity
                          ).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t">
                <div>
                  <p className="text-sm text-slate-600">Estimated Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${calculateTotal().toLocaleString()}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/portal")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting || items.length === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </div>
  );
}
