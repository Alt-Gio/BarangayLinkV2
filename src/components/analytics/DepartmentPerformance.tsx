import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building } from "lucide-react";

interface DepartmentStat {
  name: string;
  total: number;
  active: number;
  completed: number;
  completionRate: string;
}

interface DepartmentPerformanceProps {
  departments: DepartmentStat[];
}

export function DepartmentPerformance({ departments }: DepartmentPerformanceProps) {
  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Building className="w-5 h-5 text-emerald-500" />
          Department Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {departments.map((dept) => (
            <div key={dept.name} className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-white font-semibold mb-4">{dept.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total Projects</span>
                  <span className="text-white font-semibold">{dept.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Active</span>
                  <Badge className="bg-blue-600 text-white">{dept.active}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Completed</span>
                  <Badge className="bg-emerald-600 text-white">{dept.completed}</Badge>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">Completion Rate</span>
                    <span className="text-white font-semibold">{dept.completionRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${dept.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
