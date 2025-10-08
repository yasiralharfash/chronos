import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Schedule } from "@/api/entities";
import { Project } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Plus } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import ScheduleCreateDialog from "../components/schedule/ScheduleCreateDialog";
import ScheduleList from "../components/schedule/ScheduleList";

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const scheduleList = await Schedule.list("date", 500);
    setSchedules(scheduleList);

    const allUsers = await User.list("full_name", 200);
    setEmployees(allUsers.filter(u => u.role !== "admin"));

    const projectList = await Project.filter({ status: "active" }, "name", 100);
    setProjects(projectList);

    setLoading(false);
  };

  const daySchedules = schedules.filter(s => isSameDay(parseISO(s.date), selectedDate));
  const scheduledDates = schedules.map(s => parseISO(s.date));

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employee Scheduling</h1>
            <p className="text-slate-500 mt-1">Create and manage work schedules</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Schedule
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Calendar</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-lg border-none"
                modifiers={{
                  scheduled: scheduledDates
                }}
                modifiersStyles={{
                  scheduled: {
                    backgroundColor: '#6366f1',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }
                }}
              />
            </CardContent>
          </Card>

          <ScheduleList
            schedules={daySchedules}
            employees={employees}
            projects={projects}
            selectedDate={selectedDate}
            onUpdate={loadData}
          />
        </div>

        {showCreateDialog && (
          <ScheduleCreateDialog
            employees={employees}
            projects={projects}
            onClose={() => setShowCreateDialog(false)}
            onSave={loadData}
          />
        )}
      </div>
    </div>
  );
}