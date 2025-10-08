
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Project } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Briefcase, Coffee, PlayCircle, StopCircle } from "lucide-react";
import { format } from "date-fns";

export default function ClockPage() {
  const [user, setUser] = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("");
  const [onBreak, setOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentEntry) {
      const interval = setInterval(() => {
        const start = new Date(currentEntry.clock_in);
        const now = new Date();
        const diff = Math.floor((now - start) / 1000);
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        setElapsedTime(`${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentEntry]);

  const loadData = async () => {
    const userData = await User.me();
    setUser(userData);

    if (!userData.company_id) {
      alert("Please complete company setup first");
      return;
    }

    const entries = await TimeEntry.filter(
      { user_email: userData.email, company_id: userData.company_id },
      "-clock_in",
      1
    );
    const activeEntry = entries.find(e => !e.clock_out);
    setCurrentEntry(activeEntry);

    if (activeEntry?.notes) setNotes(activeEntry.notes);
    if (activeEntry?.project_id) setSelectedProject(activeEntry.project_id);
    if (activeEntry?.break_duration) setTotalBreakTime(activeEntry.break_duration);

    const projectList = await Project.filter(
      { status: "active", company_id: userData.company_id },
      "name",
      50
    );
    setProjects(projectList);
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      let location = null;
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (error) {
        console.log("Location not available");
      }

      await TimeEntry.create({
        company_id: user.company_id, // ✅ ADDED
        user_email: user.email,
        clock_in: new Date().toISOString(),
        location,
        project_id: selectedProject || null,
        notes: notes || ""
      });

      await loadData();
    } catch (error) {
      console.error("Clock in error:", error);
      alert("Failed to clock in: " + error.message);
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const clockOut = new Date().toISOString();
      const clockIn = new Date(currentEntry.clock_in);
      const diff = (new Date(clockOut) - clockIn) / (1000 * 60 * 60);
      const totalHours = Math.max(0, diff - totalBreakTime / 60);

      await TimeEntry.update(currentEntry.id, {
        clock_out: clockOut,
        total_hours: parseFloat(totalHours.toFixed(2)),
        break_duration: totalBreakTime,
        notes,
        project_id: selectedProject || null
      });

      setCurrentEntry(null);
      setNotes("");
      setSelectedProject("");
      setTotalBreakTime(0);
      setElapsedTime("");
    } catch (error) {
      console.error("Clock out error:", error);
    }
    setLoading(false);
  };

  const handleBreakToggle = async () => {
    if (onBreak) {
      const breakDuration = Math.floor((new Date() - breakStartTime) / 60000);
      const newTotal = totalBreakTime + breakDuration;
      setTotalBreakTime(newTotal);
      await TimeEntry.update(currentEntry.id, { break_duration: newTotal });
      setOnBreak(false);
      setBreakStartTime(null);
    } else {
      setOnBreak(true);
      setBreakStartTime(new Date());
    }
  };

  if (!user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Time Clock</h1>
          <p className="text-slate-500 mt-1">Track your work hours</p>
        </div>

        <Card className="bg-white border-none shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-6">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                currentEntry
                  ? "bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50"
                  : "bg-gradient-to-br from-slate-200 to-slate-300"
              }`}>
                <Clock className="w-16 h-16 text-white" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold text-slate-900">
              {elapsedTime || "00:00:00"}
            </CardTitle>
            <p className={`text-lg mt-2 ${currentEntry ? "text-green-600" : "text-slate-500"}`}>
              {currentEntry ? "Currently Clocked In" : "Ready to Clock In"}
            </p>
            {currentEntry && (
              <p className="text-sm text-slate-500 mt-2">
                Started at {format(new Date(currentEntry.clock_in), "h:mm a")}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {currentEntry?.location && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-slate-50 py-3 rounded-lg">
                <MapPin className="w-4 h-4" />
                <span>Location captured</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Project (Optional)
                </label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <Textarea
                  placeholder="Add any notes about this shift..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-24"
                />
              </div>
            </div>

            {totalBreakTime > 0 && (
              <div className="text-center py-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-700">
                  <Coffee className="w-4 h-4 inline mr-2" />
                  Total Break Time: {totalBreakTime} minutes
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {currentEntry ? (
                <>
                  <Button
                    onClick={handleBreakToggle}
                    variant="outline"
                    size="lg"
                    disabled={loading}
                    className={`${
                      onBreak
                        ? "border-green-600 text-green-600 hover:bg-green-50"
                        : "border-amber-600 text-amber-600 hover:bg-amber-50"
                    }`}
                  >
                    {onBreak ? (
                      <>
                        <PlayCircle className="w-5 h-5 mr-2" />
                        End Break
                      </>
                    ) : (
                      <>
                        <Coffee className="w-5 h-5 mr-2" />
                        Start Break
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleClockOut}
                    disabled={loading || onBreak}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <StopCircle className="w-5 h-5 mr-2" />
                    {loading ? "Clocking Out..." : "Clock Out"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleClockIn}
                  disabled={loading}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  {loading ? "Clocking In..." : "Clock In"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-white shadow-sm">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Location Tracking</h3>
                <p className="text-sm text-slate-600">
                  Your location is captured when you clock in to verify your work location.
                  This helps maintain accurate attendance records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
