import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeOffRequest } from "@/api/entities";
import { Department } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Building2, UserPlus } from "lucide-react";

export default function HRDashboard() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const allUsers = await User.list("full_name", 200);
    setEmployees(allUsers.filter(u => u.role !== "admin"));

    const deptList = await Department.list("name", 100);
    setDepartments(deptList);

    const requests = await TimeOffRequest.list("-created_date", 200);
    setTimeOffRequests(requests);

    setLoading(false);
  };

  const pendingRequests = timeOffRequests.filter(r => r.status === "pending").length;
  const approvedRequests = timeOffRequests.filter(r => r.status === "approved").length;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">HR Dashboard</h1>
          <p className="text-slate-500 mt-1">Employee management and oversight</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Employees</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {employees.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Departments</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {departments.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending Requests</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {pendingRequests}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <Briefcase className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Approved Time Off</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {approvedRequests}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Recent Hires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees
                  .filter(e => e.hire_date)
                  .sort((a, b) => new Date(b.hire_date) - new Date(a.hire_date))
                  .slice(0, 5)
                  .map((emp) => (
                    <div key={emp.id} className="p-3 rounded-lg bg-slate-50">
                      <p className="font-semibold text-slate-900">{emp.full_name}</p>
                      <p className="text-sm text-slate-500">{emp.email}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Department Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departments.map((dept) => {
                  const count = employees.filter(e => e.department_id === dept.id).length;
                  return (
                    <div key={dept.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                      <span className="font-medium text-slate-900">{dept.name}</span>
                      <span className="font-semibold text-indigo-600">{count} employees</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}