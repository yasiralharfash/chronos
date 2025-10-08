import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Schedule } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, Calendar, TrendingUp, Activity, ArrowRight, CheckCircle } from "lucide-react";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import QuickClockButton from "../components/clock/QuickClockButton";
import WeeklyHoursChart from "../components/dashboard/WeeklyHoursChart";
import UpcomingShifts from "../components/dashboard/UpcomingShifts";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [recentEntries, setRecentEntries] = useState([]);
  const [upcomingSchedule, setUpcomingSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const userData = await User.me();
    setUser(userData);

    const entries = await TimeEntry.filter(
      { user_email: userData.email },
      "-clock_in",
      50
    );

    const activeEntry = entries.find(e => !e.clock_out);
    setCurrentEntry(activeEntry);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const weekEntries = entries.filter(e => {
      const entryDate = parseISO(e.clock_in);
      return entryDate >= weekStart && entryDate <= weekEnd && e.clock_out;
    });

    const totalHours = weekEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    setWeeklyHours(totalHours);
    setRecentEntries(entries.slice(0, 5));

    const schedules = await Schedule.filter(
      { user_email: userData.email, status: "scheduled" },
      "date",
      10
    );
    setUpcomingSchedule(schedules.filter(s => new Date(s.date) >= new Date()));

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {user?.full_name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-slate-500 mt-1">Here's what's happening today</p>
          </div>
          <QuickClockButton currentEntry={currentEntry} onUpdate={loadData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Current Status</p>
                  <CardTitle className="text-2xl font-bold mt-2 text-slate-900">
                    {currentEntry ? "Clocked In" : "Clocked Out"}
                  </CardTitle>
                </div>
                <div className={`p-3 rounded-xl ${currentEntry ? "bg-green-100" : "bg-slate-100"}`}>
                  <Activity className={`w-6 h-6 ${currentEntry ? "text-green-600" : "text-slate-400"}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentEntry && (
                <p className="text-sm text-slate-500">
                  Since {format(parseISO(currentEntry.clock_in), "h:mm a")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">This Week</p>
                  <CardTitle className="text-2xl font-bold mt-2 text-slate-900">
                    {weeklyHours.toFixed(1)}h
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-indigo-100">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Total hours worked</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Upcoming Shifts</p>
                  <CardTitle className="text-2xl font-bold mt-2 text-slate-900">
                    {upcomingSchedule.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Scheduled this week</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">PTO Balance</p>
                  <CardTitle className="text-2xl font-bold mt-2 text-slate-900">
                    {user?.pto_balance || 0}h
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Available hours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WeeklyHoursChart userEmail={user?.email} />
          </div>
          <div>
            <UpcomingShifts schedules={upcomingSchedule} />
          </div>
        </div>

        <Card className="bg-white border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-900">Recent Time Entries</CardTitle>
            <Link to={createPageUrl("MyTimesheets")}>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {format(parseISO(entry.clock_in), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-slate-500">
                      {format(parseISO(entry.clock_in), "h:mm a")} -{" "}
                      {entry.clock_out ? format(parseISO(entry.clock_out), "h:mm a") : "In Progress"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {entry.total_hours ? `${entry.total_hours.toFixed(2)}h` : "-"}
                    </p>
                    <p className={`text-xs px-2 py-1 rounded-full inline-block ${
                      entry.status === "approved" ? "bg-green-100 text-green-700" :
                      entry.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {entry.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}