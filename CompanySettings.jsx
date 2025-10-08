import React, { useState, useEffect } from "react";
import { Company } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Save, Crown, Calendar, Users } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function CompanySettings() {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.company_id) {
        const companies = await Company.list("name", 100);
        const userCompany = companies.find(c => c.id === userData.company_id);
        setCompany(userCompany);
        setFormData({
          name: userCompany.name || "",
          industry: userCompany.industry || "",
          address: userCompany.address || "",
          phone: userCompany.phone || "",
          email: userCompany.email || "",
          website: userCompany.website || ""
        });
      }
    } catch (error) {
      console.error("Load error:", error);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Company.update(company.id, formData);
      alert("Company settings saved successfully!");
      loadData();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save settings. Please try again.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No company associated with your account.</p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const config = {
      trial: { color: "bg-blue-100 text-blue-700", label: "Trial" },
      active: { color: "bg-green-100 text-green-700", label: "Active" },
      suspended: { color: "bg-amber-100 text-amber-700", label: "Suspended" },
      cancelled: { color: "bg-red-100 text-red-700", label: "Cancelled" }
    };
    const { color, label } = config[status];
    return <Badge className={color}>{label}</Badge>;
  };

  const getPlanBadge = (plan) => {
    const config = {
      starter: { color: "bg-slate-100 text-slate-700", label: "Starter" },
      professional: { color: "bg-purple-100 text-purple-700", label: "Professional" },
      enterprise: { color: "bg-indigo-100 text-indigo-700", label: "Enterprise" }
    };
    const { color, label } = config[plan];
    return <Badge className={color}>{label}</Badge>;
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Company Settings</h1>
          <p className="text-slate-500 mt-1">Manage your company information and subscription</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Subscription</p>
                  <div className="mt-2">
                    {getStatusBadge(company.subscription_status)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-100">
                  <Crown className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {getPlanBadge(company.subscription_plan)}
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Trial Ends</p>
                  <CardTitle className="text-xl font-bold mt-2 text-slate-900">
                    {company.trial_ends_at ? format(parseISO(company.trial_ends_at), "MMM d, yyyy") : "N/A"}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <Calendar className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Max Employees</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {company.max_employees}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-white border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <CardTitle className="text-xl font-bold text-slate-900">Company Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Company Name</Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Input
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Website</Label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}