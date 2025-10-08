
import React, { useState, useEffect } from "react";
import { Department } from "@/api/entities";
import { User } from "@/api/entities"; // Import User entity
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Building2, Users, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Import Alert and AlertDescription

export default function DepartmentList({ departments, employees, onUpdate }) {
  const [user, setUser] = useState(null); // New state for user data
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", manager_email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // New state for error messages

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (err) {
      console.error("Failed to load user data:", err);
      setError("Failed to load user data. Some functionalities might be limited.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Clear previous errors
    if (!user || !user.company_id) {
      setError("User information (company ID) is missing. Cannot create department.");
      setLoading(false);
      return;
    }
    try {
      await Department.create({
        ...formData,
        company_id: user.company_id // Add company_id from the current user
      });
      setFormData({ name: "", description: "", manager_email: "" });
      setShowCreate(false);
      onUpdate();
    } catch (error) {
      console.error("Create error:", error);
      setError("Failed to create department. Please try again."); // Set error message
    }
    setLoading(false);
  };

  const handleDelete = async (deptId) => {
    if (!confirm("Are you sure you want to delete this department?")) {
      return;
    }

    setError(null); // Clear previous errors
    try {
      await Department.delete(deptId);
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      if (error.response?.status === 404) {
        setError("This department has already been deleted.");
        onUpdate(); // Refresh the list even if 404, to remove the non-existent item
      } else {
        setError("Failed to delete department. Please try again.");
      }
    }
  };

  const getEmployeeCount = (deptId) => {
    return employees.filter(e => e.department_id === deptId).length;
  };

  return (
    <div className="space-y-4">
      {error && ( // Display error message if present
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Departments</h3>
        <Button onClick={() => setShowCreate(true)} disabled={!user}> {/* Disable if user data isn't loaded */}
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      <div className="grid gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{dept.name}</h4>
                  <p className="text-sm text-slate-600 mt-1">{dept.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{getEmployeeCount(dept.id)} employees</span>
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(dept.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <Dialog open={true} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Department Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !user}> {/* Disable if loading or user data isn't available */}
                  {loading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
