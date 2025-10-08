
import React, { useState } from "react";
import { User } from "@/api/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Building2, DollarSign, Hash, RefreshCw, Edit, Shield } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EmployeeList({ employees, departments, onUpdate }) {
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingIds, setGeneratingIds] = useState(false);

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EMP-${timestamp}-${random}`;
  };

  const generateMissingEmployeeIds = async () => {
    if (!confirm("Generate employee IDs for all employees without IDs?")) return;
    
    setGeneratingIds(true);
    try {
      const employeesWithoutIds = employees.filter(e => !e.employee_id);
      
      for (const employee of employeesWithoutIds) {
        const newId = generateEmployeeId();
        await User.update(employee.id, { employee_id: newId });
      }
      
      onUpdate();
    } catch (error) {
      console.error("Error generating IDs:", error);
      alert("Failed to generate employee IDs. Please try again.");
    }
    setGeneratingIds(false);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_id: employee.employee_id || "",
      hourly_rate: employee.hourly_rate || "",
      phone: employee.phone || "",
      hire_date: employee.hire_date || "",
      department_id: employee.department_id || "",
      pto_balance: employee.pto_balance || 0,
      job_role: employee.job_role || "employee"
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await User.update(editingEmployee.id, {
        ...formData,
        employee_id: formData.employee_id || generateEmployeeId(),
        hourly_rate: parseFloat(formData.hourly_rate) || 0,
        pto_balance: parseFloat(formData.pto_balance) || 0
      });
      setEditingEmployee(null);
      onUpdate();
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update employee. Please try again.");
    }
    setLoading(false);
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || "-";
  };

  const getRoleBadge = (jobRole) => {
    const roleConfig = {
      employee: { label: "Employee", color: "bg-slate-100 text-slate-700" },
      manager: { label: "Manager", color: "bg-purple-100 text-purple-700" },
      supervisor: { label: "Supervisor", color: "bg-blue-100 text-blue-700" },
      hr: { label: "HR", color: "bg-green-100 text-green-700" }
    };
    const config = roleConfig[jobRole] || roleConfig.employee;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const employeesWithoutIds = employees.filter(e => !e.employee_id).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Employees</h3>
          <p className="text-sm text-slate-500 mt-1">
            Manage employee information and settings
          </p>
        </div>
        {employeesWithoutIds > 0 && (
          <Button
            onClick={generateMissingEmployeeIds}
            disabled={generatingIds}
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generatingIds ? "animate-spin" : ""}`} />
            Generate {employeesWithoutIds} Missing ID{employeesWithoutIds !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Employee ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Hourly Rate</TableHead>
              <TableHead>PTO Balance</TableHead>
              <TableHead>Hire Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                  No employees found. Invite users through the dashboard.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell>
                    {employee.employee_id ? (
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <Hash className="w-4 h-4 text-indigo-600" />
                        {employee.employee_id}
                      </div>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Not Set
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{employee.full_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      {employee.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(employee.job_role)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      {getDepartmentName(employee.department_id)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-semibold">
                        {employee.hourly_rate ? `${employee.hourly_rate.toLocaleString()} IQD/hr` : "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {employee.pto_balance || 0}h
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {employee.hire_date ? format(parseISO(employee.hire_date), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(employee)}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingEmployee && (
        <Dialog open={true} onOpenChange={() => setEditingEmployee(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Employee: {editingEmployee.full_name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>Employee ID</Label>
                <Input
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  placeholder="Auto-generated if empty"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty to auto-generate a unique ID
                </p>
              </div>
              <div>
                <Label>Job Role</Label>
                <Select 
                  value={formData.job_role} 
                  onValueChange={(value) => setFormData({...formData, job_role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Determines access permissions in the system
                </p>
              </div>
              <div>
                <Label>Department</Label>
                <Select 
                  value={formData.department_id} 
                  onValueChange={(value) => setFormData({...formData, department_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hourly Rate (IQD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData({...formData, hourly_rate: e.target.value})}
                  placeholder="50000"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label>Hire Date</Label>
                <Input
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                />
              </div>
              <div>
                <Label>PTO Balance (hours)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.pto_balance}
                  onChange={(e) => setFormData({...formData, pto_balance: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
