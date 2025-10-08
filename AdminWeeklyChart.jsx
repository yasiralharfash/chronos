
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, parseISO, isSameDay } from "date-fns";

export default function AdminWeeklyChart({ entries, employees }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weekEntries = entries.filter(e => {
    if (!e.clock_out) return false;
    const entryDate = parseISO(e.clock_in);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const data = daysOfWeek.map(day => {
    const dayEntries = weekEntries.filter(e => isSameDay(parseISO(e.clock_in), day));
    const hours = dayEntries.reduce((sum, e) => sum + (e.total_hours || 0), 0);
    const cost = dayEntries.reduce((sum, e) => {
      const employee = employees.find(emp => emp.email === e.user_email);
      return sum + (e.total_hours || 0) * (employee?.hourly_rate || 0);
    }, 0);
    return {
      day: format(day, "EEE"),
      hours: parseFloat(hours.toFixed(1)),
      cost: parseFloat(cost.toFixed(0))
    };
  });

  return (
    <Card className="bg-white border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Weekly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" stroke="#64748b" />
            <YAxis yAxisId="left" stroke="#64748b" />
            <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px"
              }}
              formatter={(value, name) => {
                if (name === "Cost (IQD)") {
                  return [`${value.toLocaleString()} IQD`, name];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} name="Hours" />
            <Bar yAxisId="right" dataKey="cost" fill="#10b981" radius={[8, 8, 0, 0]} name="Cost (IQD)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
