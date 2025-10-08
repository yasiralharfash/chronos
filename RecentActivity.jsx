import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function RecentActivity({ entries, employees }) {
  return (
    <Card className="bg-white border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => {
            const employee = employees.find(e => e.email === entry.user_email);
            return (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {employee?.full_name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {employee?.full_name || entry.user_email}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(parseISO(entry.clock_in), "MMM d, h:mm a")}
                        {entry.clock_out && ` - ${format(parseISO(entry.clock_out), "h:mm a")}`}
                      </span>
                      {entry.location && <MapPin className="w-4 h-4 ml-2" />}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {entry.total_hours ? `${entry.total_hours.toFixed(2)}h` : "In Progress"}
                  </p>
                  <Badge
                    className={`mt-1 ${
                      entry.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : entry.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {entry.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}