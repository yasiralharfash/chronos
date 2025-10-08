import React, { useState } from "react";
import { TimeEntry } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";

export default function TimesheetEditDialog({ entry, projects, onClose, onSave }) {
  const [formData, setFormData] = useState({
    clock_in: format(parseISO(entry.clock_in), "yyyy-MM-dd'T'HH:mm"),
    clock_out: entry.clock_out ? format(parseISO(entry.clock_out), "yyyy-MM-dd'T'HH:mm") : "",
    break_duration: entry.break_duration || 0,
    project_id: entry.project_id || "",
    notes: entry.notes || ""
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const clockIn = new Date(formData.clock_in);
      const clockOut = formData.clock_out ? new Date(formData.clock_out) : null;

      let totalHours = null;
      if (clockOut) {
        const diff = (clockOut - clockIn) / (1000 * 60 * 60);
        totalHours = Math.max(0, diff - formData.break_duration / 60);
      }

      await TimeEntry.update(entry.id, {
        clock_in: clockIn.toISOString(),
        clock_out: clockOut ? clockOut.toISOString() : null,
        break_duration: parseInt(formData.break_duration),
        project_id: formData.project_id || null,
        notes: formData.notes,
        total_hours: totalHours ? parseFloat(totalHours.toFixed(2)) : null
      });

      onSave();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Clock In</Label>
            <Input
              type="datetime-local"
              value={formData.clock_in}
              onChange={(e) => setFormData({...formData, clock_in: e.target.value})}
            />
          </div>
          <div>
            <Label>Clock Out</Label>
            <Input
              type="datetime-local"
              value={formData.clock_out}
              onChange={(e) => setFormData({...formData, clock_out: e.target.value})}
            />
          </div>
          <div>
            <Label>Break Duration (minutes)</Label>
            <Input
              type="number"
              min="0"
              value={formData.break_duration}
              onChange={(e) => setFormData({...formData, break_duration: e.target.value})}
            />
          </div>
          <div>
            <Label>Project</Label>
            <Select value={formData.project_id} onValueChange={(value) => setFormData({...formData, project_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
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
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}