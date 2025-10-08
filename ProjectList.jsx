
import React, { useState } from "react";
import { Project } from "@/api/entities";
import { User } from "@/api/entities"; // Added User import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ProjectList({ projects, departments, onUpdate }) {
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "active",
    department_id: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = React.useState(null); // Added user state

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
      setError("Failed to load user information.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!user || !user.company_id) {
        throw new Error("User company information is missing.");
      }
      await Project.create({
        ...formData,
        department_id: formData.department_id || null,
        company_id: user.company_id // Added company_id
      });
      setFormData({ name: "", code: "", description: "", status: "active", department_id: "" });
      setShowCreate(false);
      onUpdate();
    } catch (error) {
      console.error("Create error:", error);
      setError("Failed to create project. Please try again.");
    }
    setLoading(false);
  };

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }

    setError(null);
    try {
      await Project.delete(projectId);
      onUpdate();
    } catch (error) {
      console.error("Delete error:", error);
      if (error.response?.status === 404) {
        setError("This project has already been deleted.");
        onUpdate();
      } else {
        setError("Failed to delete project. Please try again.");
      }
    }
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "No Department";
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Projects</h3>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-slate-900">{project.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {project.code}
                    </Badge>
                    <Badge
                      className={`${
                        project.status === "active"
                          ? "bg-green-100 text-green-700"
                          : project.status === "completed"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                  <p className="text-sm text-slate-500 mt-2">
                    {getDepartmentName(project.department_id)}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(project.id)}
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
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label>Project Name</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Project Code</Label>
                <Input
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g. PROJ-2024"
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
              <div>
                <Label>Department (Optional)</Label>
                <Select value={formData.department_id} onValueChange={(value) => setFormData({...formData, department_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No Department</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
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
