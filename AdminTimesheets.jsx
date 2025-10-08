import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Project } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Search, Filter, MapPin, Edit } from "lucide-react";
import { format, parseISO } from "date-fns";
import TimesheetEditDialog from "../components/timesheets/TimesheetEditDialog";

export default function AdminTimesheets() {
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const allEntries = await TimeEntry.list("-clock_in", 500);
    setEntries(allEntries);

    const allUsers = await User.list("full_name", 200);
    setEmployees(allUsers);

    const projectList = await Project.list("name", 100);
    setProjects(projectList);

    setLoading(false);
  };

  const handleApprove = async (entryId) => {
    await TimeEntry.update(entryId, { status: "approved" });
    loadData();
  };

  const handleReject = async (entryId) => {
    await TimeEntry.update(entryId, { status: "rejected" });
    loadData();
  };

  const getEmployeeName = (email) => {
    const employee = employees.find(e => e.email === email);
    return employee?.full_name || email;
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.name} (${project.code})` : "-";
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = getEmployeeName(entry.user_email).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = entries.filter(e => e.status === "pending").length;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Timesheets</h1>
          <p className="text-slate-500 mt-1">Review and approve employee time entries</p>
        </div>

        {pendingCount > 0 && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Pending Approval</h3>
                  <p className="text-sm text-slate-600">
                    {pendingCount} time entr{pendingCount !== 1 ? 'ies' : 'y'} waiting for your review
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border-none shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle className="text-xl font-bold text-slate-900">Time Entries</CardTitle>
              <div className="flex gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(10).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium">
                          {getEmployeeName(entry.user_email)}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(entry.clock_in), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(entry.clock_in), "h:mm a")}
                        </TableCell>
                        <TableCell>
                          {entry.clock_out ? format(parseISO(entry.clock_out), "h:mm a") : (
                            <span className="text-green-600 font-medium">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {entry.total_hours ? `${entry.total_hours.toFixed(2)}h` : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {getProjectName(entry.project_id)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              entry.status === "approved"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : entry.status === "rejected"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                            } border`}
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {entry.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove(entry.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleReject(entry.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingEntry(entry)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {entry.location && (
                              <MapPin className="w-4 h-4 text-slate-400" title="Location captured" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {editingEntry && (
          <TimesheetEditDialog
            entry={editingEntry}
            projects={projects}
            onClose={() => setEditingEntry(null)}
            onSave={loadData}
          />
        )}
      </div>
    </div>
  );
}