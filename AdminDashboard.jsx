
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { TimeOffRequest } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, DollarSign, TrendingUp, UserCheck, AlertCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import AdminStatsCards from "../components/admin/AdminStatsCards";
import LiveEmployeeStatus from "../components/admin/LiveEmployeeStatus";
import RecentActivity from "../components/admin/RecentActivity";
import AdminWeeklyChart from "../components/admin/AdminWeeklyChart";

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // Added user state

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const userData = await User.me();
    setUser(userData);

    if (!userData || !userData.company_id) { // Check for userData as well
      alert("Please complete company setup first");
      setLoading(false); // Ensure loading state is reset
      return;
    }

    // Filter by company_id for all data fetches
    const allUsers = await User.filter({ company_id: userData.company_id }, "full_name", 200);
    setEmployees(allUsers.filter(u => u.role !== "admin"));

    const entries = await TimeEntry.filter({ company_id: userData.company_id }, "-clock_in", 500);
    setTimeEntries(entries);

    const requests = await TimeOffRequest.filter(
      { status: "pending", company_id: userData.company_id },
      "-created_date",
      50
    );
    setPendingRequests(requests);

    setLoading(false);
  };

  const activeEmployees = timeEntries.filter(e => !e.clock_out).length;

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEntries = timeEntries.filter(e => {
    if (!e.clock_out) return false;
    const entryDate = parseISO(e.clock_in);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  const totalWeeklyHours = weekEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
  const totalLaborCost = weekEntries.reduce((sum, e) => {
    const employee = employees.find(emp => emp.email === e.user_email);
    return sum + (e.total_hours || 0) * (employee?.hourly_rate || 0);
  }, 0);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Complete overview of your workforce</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatsCards
            title="Total Employees"
            value={employees.length}
            icon={Users}
            bgColor="bg-blue-500"
            trend={`${activeEmployees} active now`}
          />
          <AdminStatsCards
            title="Currently Clocked In"
            value={activeEmployees}
            icon={UserCheck}
            bgColor="bg-green-500"
            trend="Live status"
          />
          <AdminStatsCards
            title="Weekly Hours"
            value={`${totalWeeklyHours.toFixed(0)}h`}
            icon={Clock}
            bgColor="bg-purple-500"
            trend="This week"
          />
          <AdminStatsCards
            title="Labor Cost"
            value={`${totalLaborCost.toLocaleString()} IQD`}
            icon={DollarSign}
            bgColor="bg-indigo-500"
            trend="This week"
          />
        </div>

        {pendingRequests.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Action Required</h3>
                  <p className="text-sm text-slate-600">
                    You have {pendingRequests.length} pending time off request{pendingRequests.length !== 1 ? 's' : ''} to review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AdminWeeklyChart entries={timeEntries} employees={employees} />
          </div>
          <div>
            <LiveEmployeeStatus entries={timeEntries} employees={employees} />
          </div>
        </div>

        <RecentActivity entries={timeEntries.slice(0, 10)} employees={employees} />
      </div>
    </div>
  );
}
