import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { Clock, CheckCircle, Users, BarChart3, Shield, Zap } from "lucide-react";

export default function Home() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await User.me();
      // Already logged in, redirect based on setup status
      if (!user.company_id) {
        window.location.href = createPageUrl("CompanySetup");
      } else {
        window.location.href = createPageUrl("Dashboard");
      }
    } catch {
      // Not logged in, show landing page
      setChecking(false);
    }
  };

  const handleLogin = async () => {
    await User.login();
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/50">
              <Clock className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
            Time Tracking Made Simple
          </h1>
          
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Manage your workforce efficiently with GPS tracking, scheduling, and real-time reporting.
          </p>
          
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6 shadow-xl"
          >
            Sign In to Get Started
          </Button>
          
          <p className="text-sm text-slate-500 mt-4">
            Secure login with Google • No password needed
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl mx-auto">
          {[
            {
              icon: Clock,
              title: "GPS Time Clock",
              description: "Clock in/out with location verification and geofencing"
            },
            {
              icon: Users,
              title: "Team Management",
              description: "Manage employees, departments, and permissions"
            },
            {
              icon: BarChart3,
              title: "Real-time Reports",
              description: "Track hours, labor costs, and productivity instantly"
            },
            {
              icon: CheckCircle,
              title: "Timesheet Approval",
              description: "Review and approve employee hours with one click"
            },
            {
              icon: Shield,
              title: "Role-Based Access",
              description: "Secure permissions for admins, managers, and employees"
            },
            {
              icon: Zap,
              title: "Easy Integration",
              description: "Works seamlessly with your existing workflow"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-slate-200">
        <p className="text-slate-500 text-sm">
          © 2024 Chronos. All rights reserved.
        </p>
      </div>
    </div>
  );
}