import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { TimeOffRequest } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminTimeOff() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [reviewingRequest, setReviewingRequest] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const userData = await User.me();
    setCurrentUser(userData);

    const requestList = await TimeOffRequest.list("-created_date", 200);
    setRequests(requestList);

    const allUsers = await User.list("full_name", 200);
    setEmployees(allUsers);

    setLoading(false);
  };

  const handleReview = async (requestId, status) => {
    await TimeOffRequest.update(requestId, {
      status,
      reviewed_by: currentUser.email,
      review_notes: reviewNotes
    });

    if (status === "approved" && reviewingRequest) {
      const employee = employees.find(e => e.email === reviewingRequest.user_email);
      if (employee && reviewingRequest.type === "pto") {
        await User.update(employee.id, {
          pto_balance: (employee.pto_balance || 0) - reviewingRequest.hours_requested
        });
      }
    }

    setReviewingRequest(null);
    setReviewNotes("");
    loadData();
  };

  const getEmployeeName = (email) => {
    const employee = employees.find(e => e.email === email);
    return employee?.full_name || email;
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const reviewedRequests = requests.filter(r => r.status !== "pending");

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Time Off Requests</h1>
          <p className="text-slate-500 mt-1">Review and approve employee time off</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Pending</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {pendingRequests.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Approved</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {requests.filter(r => r.status === "approved").length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Requests</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {requests.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-indigo-100">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {pendingRequests.length > 0 && (
          <Card className="bg-white border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-slate-900">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-slate-900 text-lg">
                          {getEmployeeName(request.user_email)}
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {format(parseISO(request.start_date), "MMM d")} - {format(parseISO(request.end_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {request.hours_requested} hours · {request.type.toUpperCase()}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-4 p-3 bg-white rounded-lg">
                      {request.reason}
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setReviewingRequest(request)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          setReviewingRequest(request);
                          setReviewNotes("");
                        }}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewedRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-xl bg-slate-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {getEmployeeName(request.user_email)}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        {format(parseISO(request.start_date), "MMM d")} - {format(parseISO(request.end_date), "MMM d, yyyy")}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {request.hours_requested} hours · {request.type.toUpperCase()}
                      </p>
                    </div>
                    <Badge
                      className={`${
                        request.status === "approved"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      } border`}
                    >
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">{request.reason}</p>
                  {request.review_notes && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">Review Notes</p>
                      <p className="text-sm text-slate-700">{request.review_notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {reviewingRequest && (
          <Dialog open={true} onOpenChange={() => setReviewingRequest(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Time Off Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="font-semibold text-slate-900">
                    {getEmployeeName(reviewingRequest.user_email)}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {format(parseISO(reviewingRequest.start_date), "MMM d")} - {format(parseISO(reviewingRequest.end_date), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {reviewingRequest.hours_requested} hours · {reviewingRequest.type.toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-700 mt-3">{reviewingRequest.reason}</p>
                </div>
                <div>
                  <Label>Review Notes (Optional)</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setReviewingRequest(null)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleReview(reviewingRequest.id, "denied")}
                >
                  Deny
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleReview(reviewingRequest.id, "approved")}
                >
                  Approve
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}