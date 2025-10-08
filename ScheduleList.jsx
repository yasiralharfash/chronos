import React from "react";
import { Schedule } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Briefcase, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";

export default function ScheduleList({ schedules, employees, projects, selectedDate, onUpdate }) {
  const handleDelete = async (scheduleId) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      await Schedule.delete(scheduleId);
      onUpdate();
    }
  };

  const getEmployeeName = (email) => {
    const employee = employees.find(e => e.email === email);
    return employee?.full_name || email;
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : null;
  };

  return (
    <Card className="bg-white border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          {format(selectedDate, "MMMM d, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No schedules for this day</p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {getEmployeeName(schedule.user_email)}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{schedule.start_time} - {schedule.end_time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                      {schedule.status}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(schedule.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {schedule.project_id && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{getProjectName(schedule.project_id)}</span>
                  </div>
                )}
                {schedule.notes && (
                  <p className="text-sm text-slate-600 mt-2">{schedule.notes}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}