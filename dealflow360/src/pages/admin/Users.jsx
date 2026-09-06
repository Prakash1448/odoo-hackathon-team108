import React, { useState, useEffect } from "react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card, CardContent } from "../../components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { UserPlus, MoreHorizontal, RefreshCw, Trash2, Edit } from "lucide-react";
import apiClient from "../../services/apiClient";

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales-rep",
    company: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/admin/users");
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        company: user.company || ""
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "sales-rep",
        company: ""
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "sales-rep",
      company: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          company: formData.company
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await apiClient.put(`/admin/users/${editingUser.id}`, updateData);
      } else {
        // Create new user
        if (!formData.password) {
          alert("Password is required for new users");
          setSaving(false);
          return;
        }
        await apiClient.post("/admin/users", formData);
      }
      await fetchUsers();
      handleCloseModal();
    } catch (err) {
      alert(err.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"?`)) {
      try {
        await apiClient.delete(`/admin/users/${userId}`);
        await fetchUsers();
      } catch (err) {
        alert(err.message || "Failed to delete user");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <PageHeader title="Users" description="Manage user roles and permissions from MySQL Database." />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2" onClick={() => handleOpenModal()}>
            <UserPlus className="w-4 h-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Access Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-indigo-600">{user.id}</TableCell>
                    <TableCell className="font-semibold text-slate-900">{user.name}</TableCell>
                    <TableCell className="text-slate-500">{user.email}</TableCell>
                    <TableCell>
                      <span className="capitalize">{user.roleName || user.role.replace('-', ' ')}</span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-indigo-600"
                          onClick={() => handleOpenModal(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-slate-400 hover:text-red-600"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      {error ? `Error: ${error}` : "No users found in database."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingUser ? "Edit User" : "Add New User"}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter user name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email"
                    disabled={editingUser ? true : false}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password {editingUser && <span className="text-xs text-slate-500">(leave empty to keep current)</span>} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={editingUser ? "Leave empty to keep current" : "Enter password"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="sales-rep">Sales Rep</option>
                    <option value="sales-manager">Sales Manager</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter company name"
                  />
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
                  onClick={handleSaveUser}
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save User"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
