import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function TimesheetTable({ entries, projects, loading, onEdit }) {
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? `${project.name} (${project.code})` : "-";
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-green-100 text-green-700 border-green-200",
      rejected: "bg-red-100 text-red-700 border-red-200"
    };
    return (
      <Badge className={`${colors[status]} border`}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="bg-white border-none shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Time Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
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
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    No time entries found for this period
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium">
                      {format(parseISO(entry.clock_in), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(entry.clock_in), "h:mm a")}
                    </TableCell>
                    <TableCell>
                      {entry.clock_out ? format(parseISO(entry.clock_out), "h:mm a") : (
                        <span className="text-green-600 font-medium">In Progress</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {entry.total_hours ? `${entry.total_hours.toFixed(2)}h` : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {getProjectName(entry.project_id)}
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(entry)}
                          disabled={entry.status === "approved"}
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
  );
}