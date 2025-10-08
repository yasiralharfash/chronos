
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Department } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, BarChart3, DollarSign, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminReports() {
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [selectedDept, setSelectedDept] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedDept]);

  const loadData = async () => {
    setLoading(true);

    const allUsers = await User.list("full_name", 200);
    setEmployees(allUsers.filter(u => u.role !== "admin"));

    const allEntries = await TimeEntry.list("-clock_in", 1000);
    const filtered = allEntries.filter(e => {
      if (!e.clock_out) return false;
      const entryDate = parseISO(e.clock_in);
      return entryDate >= dateRange.from && entryDate <= dateRange.to;
    });
    setEntries(filtered);

    const deptList = await Department.list("name", 100);
    setDepartments(deptList);

    setLoading(false);
  };

  const exportToCSV = () => {
    const headers = ["Employee", "Date", "Clock In", "Clock Out", "Hours", "Department", "Hourly Rate", "Cost"];
    const rows = entries.map(entry => {
      const employee = employees.find(e => e.email === entry.user_email);
      const dept = departments.find(d => d.id === employee?.department_id);
      const cost = (entry.total_hours || 0) * (employee?.hourly_rate || 0);
      return [
        employee?.full_name || entry.user_email,
        format(parseISO(entry.clock_in), "yyyy-MM-dd"),
        format(parseISO(entry.clock_in), "HH:mm"),
        format(parseISO(entry.clock_out), "HH:mm"),
        entry.total_hours?.toFixed(2),
        dept?.name || "-",
        employee?.hourly_rate || 0,
        cost.toFixed(2)
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  const totalHours = entries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
  const totalCost = entries.reduce((sum, e) => {
    const employee = employees.find(emp => emp.email === e.user_email);
    return sum + (e.total_hours || 0) * (employee?.hourly_rate || 0);
  }, 0);

  const employeeData = employees.map(emp => {
    const empEntries = entries.filter(e => e.email === emp.email);
    const hours = empEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    return {
      name: emp.full_name,
      hours: parseFloat(hours.toFixed(1))
    };
  }).sort((a, b) => b.hours - a.hours).slice(0, 10);

  const deptData = departments.map(dept => {
    const deptEmployees = employees.filter(e => e.department_id === dept.id);
    const hours = entries.filter(e => deptEmployees.some(emp => emp.email === e.user_email))
      .reduce((sum, e) => sum + (e.total_hours || 0), 0);
    return {
      name: dept.name,
      hours: parseFloat(hours.toFixed(1))
    };
  });

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-500 mt-1">Detailed insights into workforce productivity</p>
          </div>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Hours</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {totalHours.toFixed(0)}h
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-indigo-100">
                  <Clock className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Across all employees</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Labor Cost</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} IQD
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Total payroll</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Avg Cost/Hour</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {totalHours > 0 ? (totalCost / totalHours).toLocaleString(undefined, {maximumFractionDigits: 0}) : "0"} IQD
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Average rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Top Employees by Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Hours by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.hours}h`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="hours"
                  >
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
