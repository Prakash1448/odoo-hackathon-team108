import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Plus, Edit2, Trash2, RefreshCw } from "lucide-react";
import apiClient from "../../services/apiClient";

export function UpsellRules() {
  const [rules, setRules] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    triggerProductId: "",
    recProductId: "",
    type: "Upsell",
    minMargin: 15,
    isPromo: false,
    title: "",
    confidence: 50
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/admin/rules");
      setRules(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiClient.get("/api/products");
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchProducts();
  }, []);

  const toggleActive = async (id) => {
    try {
      const res = await apiClient.put(`/admin/rules/${id}/toggle`);
      setRules(rules.map(r => r.id === id ? { ...r, active: res.active } : r));
    } catch (err) {
      alert("Failed to toggle rule: " + err.message);
    }
  };

  const handleOpenModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        triggerProductId: rule.triggerProductId,
        recProductId: rule.recProductId,
        type: rule.type,
        minMargin: rule.minMargin,
        isPromo: rule.isPromo,
        title: rule.title,
        confidence: rule.confidence
      });
    } else {
      setEditingRule(null);
      setFormData({
        triggerProductId: "",
        recProductId: "",
        type: "Upsell",
        minMargin: 15,
        isPromo: false,
        title: "",
        confidence: 50
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : (name === "minMargin" || name === "confidence" ? parseFloat(value) : value)
    }));
  };

  const handleSaveRule = async () => {
    if (!formData.triggerProductId || !formData.recProductId) {
      alert("Please select both trigger and recommended products");
      return;
    }

    setSaving(true);
    try {
      if (editingRule) {
        // Update existing rule - note: backend may not have a PUT endpoint yet
        // For now, delete and recreate
        await apiClient.delete(`/admin/rules/${editingRule.id}`);
        await apiClient.post("/admin/rules", formData);
      } else {
        // Create new rule
        await apiClient.post("/admin/rules", formData);
      }
      await fetchRules();
      handleCloseModal();
    } catch (err) {
      alert(err.message || "Failed to save rule");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete the rule "${title}"?`)) {
      try {
        await apiClient.delete(`/admin/rules/${id}`);
        await fetchRules();
      } catch (err) {
        alert(err.message || "Failed to delete rule");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Intelligence Rules Engine" 
        description="Manage the AI recommendation rules for upsell and cross-sell suggestions in MySQL Database."
      >
        <Button variant="outline" size="sm" onClick={fetchRules} disabled={loading} className="mr-2">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button onClick={() => handleOpenModal()}><Plus className="mr-2 h-4 w-4" /> Create Rule</Button>
      </PageHeader>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Trigger Product</TableHead>
                <TableHead>Recommended Product</TableHead>
                <TableHead>Rule Type</TableHead>
                <TableHead>Min Margin</TableHead>
                <TableHead>Promotion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-slate-900">{rule.triggerProduct}</TableCell>
                  <TableCell className="text-indigo-600 font-medium">{rule.recProduct}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${rule.type === 'Upsell' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {rule.type}
                    </span>
                  </TableCell>
                  <TableCell>{rule.minMargin}%</TableCell>
                  <TableCell>
                    {rule.isPromo ? (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">Promo</span>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <button 
                      onClick={() => toggleActive(rule.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${rule.active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <span className="sr-only">Toggle rule</span>
                      <span aria-hidden="true" className="pointer-events-none absolute h-full w-full rounded-md bg-white"></span>
                      <span aria-hidden="true" className={`pointer-events-none absolute mx-auto h-4 w-4 rounded-full bg-white shadow ring-1 ring-black/5 transition duration-200 ease-in-out ${rule.active ? 'translate-x-2' : '-translate-x-2'}`}></span>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                      onClick={() => handleOpenModal(rule)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-600"
                      onClick={() => handleDeleteRule(rule.id, rule.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rules.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    {error ? `Error: ${error}` : "No intelligence rules configured."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingRule ? "Edit Rule" : "Create New Rule"}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Trigger Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="triggerProductId"
                    value={formData.triggerProductId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Recommended Product <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="recProductId"
                    value={formData.recProductId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rule Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Upsell">Upsell</option>
                    <option value="Cross-sell">Cross-sell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Min Margin (%)
                  </label>
                  <input
                    type="number"
                    name="minMargin"
                    value={formData.minMargin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Confidence Score
                  </label>
                  <input
                    type="number"
                    name="confidence"
                    value={formData.confidence}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Rule Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter rule title"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPromo"
                    name="isPromo"
                    checked={formData.isPromo}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                  />
                  <label htmlFor="isPromo" className="ml-2 text-sm font-medium text-slate-700">
                    Mark as Promotion
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRule}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Rule"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
