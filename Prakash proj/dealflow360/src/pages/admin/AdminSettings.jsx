import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { productService } from "../../services/productService";
import { ShieldAlert } from "lucide-react";

export function AdminSettings() {
  // Product state
  const [products, setProducts] = useState([]);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await productService.getAll();
    setProducts(data);
  };

  const handleOpenProductForm = (product = null) => {
    setCurrentProduct(product || { name: "", category: "Hardware", price: 0, cost: 0, maxDiscount: 15 });
    setIsEditingProduct(true);
    setFormError("");
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!currentProduct.name || currentProduct.price < 0 || currentProduct.cost < 0) {
      setFormError("Please provide a valid name, and ensure price and cost are not negative.");
      return;
    }
    setFormError("");

    if (currentProduct.id) {
      await productService.update(currentProduct.id, currentProduct);
    } else {
      await productService.create(currentProduct);
    }

    setIsEditingProduct(false);
    loadProducts();
  };

  const handleDeactivate = async (id) => {
    await productService.update(id, { status: "Inactive" });
    loadProducts();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader title="System Configuration" description="Manage global catalogs, rules, and operational settings." />
      
      <Card>
        <CardContent className="p-6">
          {!isEditingProduct && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-900">Product Catalog</h3>
                <Button onClick={() => handleOpenProductForm()}>+ Add Product</Button>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell className="text-right">${p.price.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${p.status === 'Inactive' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                            {p.status || "Active"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenProductForm(p)}>Edit</Button>
                          {p.status !== 'Inactive' && (
                            <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDeactivate(p.id)}>Deactivate</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {isEditingProduct && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">{currentProduct.id ? "Edit Product" : "New Product"}</h3>
                <Button variant="ghost" onClick={() => setIsEditingProduct(false)}>Cancel</Button>
              </div>
              
              {formError && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded flex items-start gap-2 border border-red-200">
                  <ShieldAlert className="w-5 h-5 flex-shrink-0" /> {formError}
                </div>
              )}

              <form className="space-y-4 max-w-xl" onSubmit={handleSaveProduct}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border rounded p-2 focus:outline-none focus:border-indigo-500" 
                    value={currentProduct.name}
                    onChange={e => setCurrentProduct({...currentProduct, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select 
                    className="w-full border rounded p-2 outline-none focus:border-indigo-500"
                    value={currentProduct.category}
                    onChange={e => setCurrentProduct({...currentProduct, category: e.target.value})}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Services">Services</option>
                    <option value="Subscriptions">Subscriptions</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Base Price ($)</label>
                    <input 
                      type="number" min="0" step="0.01" required
                      className="w-full border rounded p-2 focus:outline-none focus:border-indigo-500" 
                      value={currentProduct.price}
                      onChange={e => setCurrentProduct({...currentProduct, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost ($)</label>
                    <input 
                      type="number" min="0" step="0.01" required
                      className="w-full border rounded p-2 focus:outline-none focus:border-indigo-500" 
                      value={currentProduct.cost}
                      onChange={e => setCurrentProduct({...currentProduct, cost: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Save Product</Button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
