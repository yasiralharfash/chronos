import React, { useState, useEffect } from "react";
import { Invitation } from "@/api/entities";
import { PreregisteredEmployee } from "@/api/entities";
import { User } from "@/api/entities";
import { Company } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Building2, AlertCircle, Loader2, XCircle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";

export default function AcceptInvite() {
  const [invitation, setInvitation] = useState(null);
  const [company, setCompany] = useState(null);
  const [preregistered, setPreregistered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    department_id: "",
    emergency_contact_name: "",
    emergency_contact_phone: ""
  });

  useEffect(() => {
    checkAuthAndLoadInvitation();
  }, []);

  const checkAuthAndLoadInvitation = async () => {
    console.log("🔍 Checking authentication and loading invitation...");
    setLoading(true);
    setError(null);

    try {
      // ✅ First, get the token (from URL or localStorage)
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get("token");
      
      // ✅ If no token in URL, check localStorage (after login redirect)
      if (!token) {
        token = localStorage.getItem('invitation_token');
        console.log("Token from localStorage:", token);
      } else {
        // ✅ Store token in localStorage for after login
        localStorage.setItem('invitation_token', token);
        console.log("Token stored in localStorage:", token);
      }

      if (!token) {
        console.error("❌ No token found in URL or localStorage");
        setError("Invalid invitation link - no token provided");
        setLoading(false);
        return;
      }

      // Check if user is authenticated
      let currentUser = null;
      try {
        currentUser = await User.me();
        console.log("✅ User is authenticated:", currentUser);
        setIsAuthenticated(true);
      } catch (authError) {
        console.log("❌ User is NOT authenticated (this is normal for new invites)");
        setIsAuthenticated(false);
        setLoading(false);
        setStep(1);
        return;
      }

      // ✅ User IS authenticated, load invitation data
      console.log("📡 Fetching invitation with token:", token);
      const invites = await Invitation.filter({ invitation_token: token }, "-created_date", 1);
      
      console.log("Found invitations:", invites);

      if (invites.length === 0) {
        console.error("❌ Invitation not found");
        setError("Invitation not found. The link may be invalid or expired.");
        // ✅ Clear token from localStorage
        localStorage.removeItem('invitation_token');
        setLoading(false);
        return;
      }

      const invite = invites[0];
      console.log("✅ Invitation found:", invite);
      
      if (invite.status === "accepted") {
        console.error("❌ Invitation already used");
        setError("This invitation has already been used. Please contact your administrator.");
        localStorage.removeItem('invitation_token');
        setLoading(false);
        return;
      }

      if (new Date(invite.expires_at) < new Date()) {
        console.error("❌ Invitation expired");
        setError("This invitation has expired. Please request a new invitation from your administrator.");
        localStorage.removeItem('invitation_token');
        setLoading(false);
        return;
      }

      setInvitation(invite);
      console.log("✅ Invitation set successfully");

      // Load company
      console.log("📡 Loading company:", invite.company_id);
      const companies = await Company.list("name", 100);
      const inviteCompany = companies.find(c => c.id === invite.company_id);
      console.log("Company found:", inviteCompany);
      setCompany(inviteCompany);

      // Load pre-registered employee data
      console.log("📡 Loading pre-registered employee:", invite.email);
      const preregisteredEmployees = await PreregisteredEmployee.filter(
        { email: invite.email, company_id: invite.company_id },
        "-created_date",
        1
      );
      
      console.log("Pre-registered employees found:", preregisteredEmployees);

      if (preregisteredEmployees.length > 0) {
        const preEmp = preregisteredEmployees[0];
        console.log("✅ Pre-registered employee found:", preEmp);
        setPreregistered(preEmp);
        setFormData({
          phone: preEmp.phone || "",
          department_id: preEmp.department_id || "",
          emergency_contact_name: "",
          emergency_contact_phone: ""
        });
      }

      console.log("✅ All data loaded successfully");
      setStep(2);
      setLoading(false);

    } catch (error) {
      console.error("❌ Load error:", error);
      setError(`Failed to load invitation: ${error.message}`);
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    // ✅ Token is already in localStorage, just redirect to login
    await User.login();
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      console.log("🔄 Completing invitation setup...");
      const currentUser = await User.me();
      console.log("Current user:", currentUser);
      
      const updateData = {
        company_id: invitation.company_id,
        phone: formData.phone,
        department_id: formData.department_id || null,
        employee_id: preregistered?.employee_id || generateEmployeeId(),
        hourly_rate: preregistered?.hourly_rate || 0,
        hire_date: preregistered?.hire_date || new Date().toISOString().split('T')[0],
        pto_balance: preregistered?.pto_balance || 0,
        job_role: preregistered?.job_role || "employee"
      };

      console.log("Updating user with data:", updateData);
      await User.updateMyUserData(updateData);

      console.log("Marking invitation as accepted...");
      await Invitation.update(invitation.id, {
        status: "accepted",
        accepted_at: new Date().toISOString()
      });

      if (preregistered) {
        console.log("Linking pre-registered employee...");
        await PreregisteredEmployee.update(preregistered.id, {
          status: "linked",
          linked_user_email: currentUser.email
        });
      }

      // ✅ Clear invitation token from localStorage
      localStorage.removeItem('invitation_token');

      console.log("✅ Setup complete!");
      setStep(3);
      
      setTimeout(() => {
        window.location.href = createPageUrl("Dashboard");
      }, 2000);
    } catch (error) {
      console.error("❌ Complete error:", error);
      setError(`Failed to complete setup: ${error.message}`);
    }
    setSubmitting(false);
  };

  const generateEmployeeId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `EMP-${timestamp}-${random}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <Card className="max-w-md w-full bg-white shadow-2xl border-none">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Invalid Invitation</h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button
              onClick={() => window.location.href = createPageUrl("Home")}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <Card className="max-w-md w-full bg-white shadow-2xl border-none">
          <CardHeader className="text-center pb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-3xl font-bold">Welcome to {company?.name || "Chronos"}!</CardTitle>
            <p className="text-indigo-100 mt-2">You've been invited to join the team</p>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <Alert className="mb-6">
              <LogIn className="h-4 w-4" />
              <AlertDescription>
                Please sign in with your Google account to accept this invitation and complete your registration.
              </AlertDescription>
            </Alert>

            {preregistered && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg text-left">
                <h4 className="font-semibold text-slate-900 mb-2">Your Details:</h4>
                <p className="text-sm text-slate-600"><strong>Name:</strong> {preregistered.full_name}</p>
                <p className="text-sm text-slate-600"><strong>Email:</strong> {invitation?.email}</p>
                <p className="text-sm text-slate-600"><strong>Role:</strong> {preregistered.job_role}</p>
              </div>
            )}

            <Button
              onClick={handleLogin}
              size="lg"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign In with Google
            </Button>

            <p className="text-xs text-slate-500 mt-4">
              By signing in, you'll be able to complete your employee profile and access the time tracking system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <Card className="max-w-md w-full bg-white shadow-2xl border-none">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Welcome to {company?.name}!</h2>
            <p className="text-slate-600">
              Your account has been set up successfully. Redirecting to your dashboard...
            </p>
            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <Card className="max-w-2xl w-full bg-white shadow-2xl border-none">
        <CardHeader className="text-center pb-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-3xl font-bold">Join {company?.name || "Your Company"}</CardTitle>
          <p className="text-indigo-100 mt-2">Complete your account setup to get started</p>
        </CardHeader>
        <CardContent className="p-8">
          {preregistered && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Welcome, {preregistered.full_name}!</strong> Your employee profile has been pre-configured.
                Please verify and complete the information below.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleComplete} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={preregistered?.full_name || ""}
                  disabled
                  className="bg-slate-50"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={invitation?.email || ""}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+964 XXX XXX XXXX"
                />
              </div>
              <div>
                <Label>Employee ID</Label>
                <Input
                  value={preregistered?.employee_id || "Auto-generated"}
                  disabled
                  className="bg-slate-50"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Emergency Contact Name</Label>
                <Input
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                  placeholder="Contact person name"
                />
              </div>
              <div>
                <Label>Emergency Contact Phone</Label>
                <Input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                  placeholder="+964 XXX XXX XXXX"
                />
              </div>
            </div>

            {preregistered && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-3">Your Employment Details</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Job Role:</span>
                    <p className="font-medium capitalize">{preregistered.job_role}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Hourly Rate:</span>
                    <p className="font-medium">{preregistered.hourly_rate?.toLocaleString()} IQD</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Hire Date:</span>
                    <p className="font-medium">{preregistered.hire_date}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">PTO Balance:</span>
                    <p className="font-medium">{preregistered.pto_balance} hours</p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Setting up your account...
                </>
              ) : (
                <>Complete Setup</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}