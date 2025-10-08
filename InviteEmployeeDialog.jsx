
import React, { useState } from "react";
import { inviteEmployee } from "@/api/functions";
import { User } from "@/api/entities";
import { Department } from "@/api/entities";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, MessageSquare, Send, AlertCircle, CheckCircle2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InviteEmployeeDialog({ onClose, onInvite, companyName }) {
  const [inviteMethod, setInviteMethod] = useState("email");
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fullName: "",
    departmentId: "",
    hourlyRate: "",
    jobRole: "employee"
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [response, setResponse] = useState(null);

  React.useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const user = await User.me();
      const depts = await Department.filter({ company_id: user.company_id }, "name", 100);
      setDepartments(depts);
    } catch (error) {
      console.error("Load departments error:", error);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await User.me();
      
      const result = await inviteEmployee({
        email: formData.email,
        phone: formData.phone,
        fullName: formData.fullName,
        companyId: user.company_id,
        departmentId: formData.departmentId,
        hourlyRate: formData.hourlyRate,
        jobRole: formData.jobRole,
        inviteMethod: inviteMethod
      });

      setResponse(result.data);
      setSuccess(true);
    } catch (error) {
      console.error("Invite error:", error);
      setError(error.response?.data?.error || "Failed to send invitation");
    }
    setLoading(false);
  };

  // The copyToClipboard function is replaced by an inline handler in the new success UI for the link input.
  // Kept here in case it's used elsewhere, but for the link, it's inline now.
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const openDashboard = () => {
    window.open("https://base44.app/dashboard", "_blank");
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-600" />
            Invite Employee
          </DialogTitle>
        </DialogHeader>

        {success && response ? (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Employee Invitation Created!
              </h3>
              <p className="text-sm text-slate-600">
                Send this invitation link to {formData.fullName}
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-800">
                <strong>3 Ways to Send the Invitation:</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-2">
                  <li><strong>Copy & Share:</strong> Copy the link below and send via WhatsApp, Telegram, or email</li>
                  <li><strong>Via base44:</strong> Go to Dashboard → Users → Invite User → Enter: <span className="font-mono">{formData.email}</span></li>
                  <li><strong>Setup email (recommended):</strong> Configure SendGrid for automatic emails</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-slate-50 rounded-lg border-2 border-indigo-200">
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                📋 Invitation Link:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={response.inviteLink}
                  readOnly
                  className="font-mono text-xs"
                  onClick={(e) => e.target.select()}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(response.inviteLink);
                    alert('Copied to clipboard!');
                  }}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={openDashboard}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Open base44 Dashboard (Optional)
              </Button>

              <Button
                onClick={() => {
                  onInvite();
                  onClose();
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInvite}>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs value={inviteMethod} onValueChange={setInviteMethod}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="sms">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    SMS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Employee will receive an email with registration link
                    </AlertDescription>
                  </Alert>
                </TabsContent>

                <TabsContent value="sms" className="space-y-4">
                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Employee will receive an SMS with registration link
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="employee@company.com"
                  />
                </div>
              </div>

              {inviteMethod === 'sms' && (
                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Job Role *</Label>
                  <Select
                    value={formData.jobRole}
                    onValueChange={(value) => setFormData({...formData, jobRole: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Department</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) => setFormData({...formData, departmentId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Hourly Rate (IQD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({...formData, hourlyRate: e.target.value})}
                  placeholder="50000"
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
