import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function LiveEmployeeStatus({ entries, employees }) {
  const activeEntries = entries.filter(e => !e.clock_out);

  return (
    <Card className="bg-white border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          Live Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeEntries.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No employees clocked in</p>
            </div>
          ) : (
            activeEntries.map((entry) => {
              const employee = employees.find(e => e.email === entry.user_email);
              return (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {employee?.full_name || entry.user_email}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Clocked in at {format(parseISO(entry.clock_in), "h:mm a")}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}