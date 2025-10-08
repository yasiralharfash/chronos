import React from "react";
import { Invitation } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Clock, X, RefreshCw } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function PendingInvitations({ invitations, onUpdate }) {
  const [loading, setLoading] = React.useState(false);

  const handleResend = async (invitation) => {
    setLoading(true);
    try {
      // In a real app, you'd resend the email here
      alert(`Invitation resent to ${invitation.email}`);
    } catch (error) {
      console.error("Resend error:", error);
    }
    setLoading(false);
  };

  const handleCancel = async (invitationId) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    
    try {
      await Invitation.delete(invitationId);
      onUpdate();
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  if (invitations.length === 0) return null;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-600" />
          Pending Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-100"
            >
              <div>
                <p className="font-semibold text-slate-900">{invitation.email}</p>
                <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Invited {format(parseISO(invitation.created_date), "MMM d, yyyy")}
                  </span>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {invitation.status}
                  </Badge>
                </div>
                {invitation.expires_at && (
                  <p className="text-xs text-slate-400 mt-1">
                    Expires {format(parseISO(invitation.expires_at), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleResend(invitation)}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCancel(invitation.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}