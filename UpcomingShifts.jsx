import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function UpcomingShifts({ schedules }) {
  return (
    <Card className="bg-white border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Upcoming Shifts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No upcoming shifts</p>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {format(parseISO(schedule.date), "EEE, MMM d")}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {schedule.start_time} - {schedule.end_time}
                      </span>
                    </div>
                    {schedule.notes && (
                      <p className="text-sm text-slate-500 mt-2">{schedule.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}