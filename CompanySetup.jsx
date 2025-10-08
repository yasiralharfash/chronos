
import React, { useState, useEffect } from "react";
import { Company } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CompanySetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true); // New state for access check
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    timezone: "Asia/Baghdad",
    subscription_plan: "starter"
  });

  // CHECK: Make sure only users WITHOUT company can access this page
  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await User.me();
      
      // If user already has a company, redirect to dashboard
      if (currentUser.company_id) {
        console.log("User already has company, redirecting to dashboard");
        navigate(createPageUrl("Dashboard")); // Changed from AdminDashboard to Dashboard as per common practice
        return;
      }
      
      // User doesn't have company, they can set one up
      setCheckingAccess(false);
    } catch (error) {
      console.error("Access check error:", error);
      // If not logged in or other error, redirect to home
      window.location.href = createPageUrl("Home");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentUser = await User.me();
      
      // Create company with current user as owner
      const company = await Company.create({
        ...formData,
        owner_email: currentUser.email,
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Update user with company_id and mark as company admin
      await User.updateMyUserData({
        company_id: company.id,
        is_company_admin: true,
        job_role: "owner", // Set a default role for the owner
        employee_id: `ADMIN-${Date.now()}`, // Unique employee ID
        department_id: null, // No department initially
        hourly_rate: 0, // Default hourly rate
        hire_date: new Date().toISOString().split('T')[0], // Hire date as today
        phone: formData.phone || "", // Use phone from form or empty string
        pto_balance: 0 // Initial PTO balance
      });

      setStep(2);
      setTimeout(() => {
        navigate(createPageUrl("AdminDashboard"));
      }, 2000);
    } catch (error) {
      console.error("Setup error:", error);
      alert("Failed to set up company. Please try again.");
    }
    setLoading(false);
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
        <Card className="max-w-md w-full bg-white shadow-2xl border-none">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Company Created Successfully!</h2>
            <p className="text-slate-600">
              Redirecting to your dashboard...
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
          <CardTitle className="text-3xl font-bold">Welcome to Chronos</CardTitle>
          <p className="text-indigo-100 mt-2">Let's set up your company time tracking system</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Company Name *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <Label>Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => setFormData({...formData, industry: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Company Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder="Street address, city, country"
                rows={2}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+964 XXX XXX XXXX"
                />
              </div>
              <div>
                <Label>Company Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="info@company.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label>Website</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://company.com"
                />
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => setFormData({...formData, timezone: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Baghdad">Baghdad (GMT+3)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                    <SelectItem value="Asia/Riyadh">Riyadh (GMT+3)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
                    <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Subscription Plan</Label>
              <div className="grid md:grid-cols-3 gap-4 mt-3">
                {[
                  { id: "starter", name: "Starter", employees: "10", price: "Free Trial" },
                  { id: "professional", name: "Professional", employees: "50", price: "$49/month" },
                  { id: "enterprise", name: "Enterprise", employees: "Unlimited", price: "$149/month" }
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormData({...formData, subscription_plan: plan.id})}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.subscription_plan === plan.id
                        ? "border-indigo-600 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <h4 className="font-semibold text-slate-900">{plan.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">Up to {plan.employees} employees</p>
                    <p className="text-sm font-semibold text-indigo-600 mt-2">{plan.price}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg py-6"
            >
              {loading ? "Creating Company..." : "Complete Setup"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="text-xs text-center text-slate-500 mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              <br />
              Your 30-day free trial starts today.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
