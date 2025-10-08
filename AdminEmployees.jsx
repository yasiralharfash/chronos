
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Department } from "@/api/entities";
import { Project } from "@/api/entities";
import { GeofenceLocation } from "@/api/entities";
import { Invitation } from "@/api/entities";
import { Company } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, Briefcase, MapPin, UserPlus, Mail, ChevronDown } from "lucide-react";
import EmployeeList from "../components/employees/EmployeeList";
import DepartmentList from "../components/employees/DepartmentList";
import ProjectList from "../components/employees/ProjectList";
import GeofenceList from "../components/employees/GeofenceList";
import InviteEmployeeDialog from "../components/employees/InviteEmployeeDialog";
import PendingInvitations from "../components/employees/PendingInvitations";
import AddEmployeeManualDialog from "../components/employees/AddEmployeeManualDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const userData = await User.me();
    setUser(userData);

    if (!userData.company_id) {
      setLoading(false);
      return;
    }

    const allUsers = await User.filter({ company_id: userData.company_id }, "full_name", 200);
    setEmployees(allUsers.filter(u => u.role !== "admin"));

    const deptList = await Department.filter({ company_id: userData.company_id }, "name", 100);
    setDepartments(deptList);

    const projectList = await Project.filter({ company_id: userData.company_id }, "name", 100);
    setProjects(projectList);

    const geoList = await GeofenceLocation.filter({ company_id: userData.company_id }, "name", 100);
    setGeofences(geoList);

    const inviteList = await Invitation.filter(
      { company_id: userData.company_id, status: "pending" },
      "-created_date",
      50
    );
    setInvitations(inviteList);

    const companies = await Company.list("name", 100);
    const userCompany = companies.find(c => c.id === userData.company_id);
    setCompany(userCompany);

    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Employee Management</h1>
            <p className="text-slate-500 mt-1">Manage employees, departments, projects, and locations</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                size="lg"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add Employee
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowInviteDialog(true)}>
                <Mail className="w-4 h-4 mr-2" />
                Invite by Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowManualDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Manually
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {invitations.length > 0 && (
          <PendingInvitations invitations={invitations} onUpdate={loadData} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Employees</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {employees.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Departments</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {departments.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-purple-100">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Projects</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {projects.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-green-100">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-white border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Locations</p>
                  <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
                    {geofences.length}
                  </CardTitle>
                </div>
                <div className="p-3 rounded-xl bg-indigo-100">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <Card className="bg-white border-none shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="employees">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="departments">Departments</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="geofences">Geofences</TabsTrigger>
              </TabsList>

              <TabsContent value="employees">
                <EmployeeList employees={employees} departments={departments} onUpdate={loadData} />
              </TabsContent>

              <TabsContent value="departments">
                <DepartmentList departments={departments} employees={employees} onUpdate={loadData} />
              </TabsContent>

              <TabsContent value="projects">
                <ProjectList projects={projects} departments={departments} onUpdate={loadData} />
              </TabsContent>

              <TabsContent value="geofences">
                <GeofenceList geofences={geofences} onUpdate={loadData} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {showInviteDialog && (
        <InviteEmployeeDialog
          onClose={() => setShowInviteDialog(false)}
          onInvite={loadData}
          companyName={company?.name}
        />
      )}

      {showManualDialog && (
        <AddEmployeeManualDialog
          onClose={() => setShowManualDialog(false)}
          onAdd={loadData}
          departments={departments}
          companyId={user?.company_id}
        />
      )}
    </div>
  );
}
