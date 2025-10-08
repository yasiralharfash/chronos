import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function AdminStatsCards({ title, value, icon: Icon, bgColor, trend }) {
  return (
    <Card className="bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
              {value}
            </CardTitle>
          </div>
          <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${bgColor.replace('bg-', 'text-')}`} />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-slate-600">{trend}</span>
          </div>
        )}
      </CardHeader>
    </Card>
  );
}