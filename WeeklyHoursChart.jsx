import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TimeEntry } from "@/api/entities";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isSameDay } from "date-fns";

export default function WeeklyHoursChart({ userEmail }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, [userEmail]);

  const loadWeeklyData = async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    const entries = await TimeEntry.filter({ user_email: userEmail }, "-clock_in", 100);

    const weekEntries = entries.filter(e => {
      if (!e.clock_out) return false;
      const entryDate = parseISO(e.clock_in);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const data = daysOfWeek.map(day => {
      const dayEntries = weekEntries.filter(e => isSameDay(parseISO(e.clock_in), day));
      const hours = dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
      return {
        day: format(day, "EEE"),
        hours: parseFloat(hours.toFixed(1))
      };
    });

    setChartData(data);
    setLoading(false);
  };

  return (
    <Card className="bg-white border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Weekly Hours</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" stroke="#64748b" />
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
        )}
      </CardContent>
    </Card>
  );
}