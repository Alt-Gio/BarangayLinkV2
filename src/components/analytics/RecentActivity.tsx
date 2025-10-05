import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

interface Project {
  _id: string;
  title: string;
  department: string;
  endDate?: number;
}

interface RecentActivityProps {
  recentCompletions: Project[];
  upcomingDeadlines: Project[];
}

export function RecentActivity({ recentCompletions, upcomingDeadlines }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Completions */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Recent Completions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCompletions.length > 0 ? (
              recentCompletions.map((project) => (
                <div key={project._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{project.title}</p>
                    <p className="text-gray-400 text-xs">{project.department}</p>
                  </div>
                  <Badge className="bg-emerald-600 text-white ml-2">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Done
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No completed projects yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card className="bg-white/5 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((project) => (
                <div key={project._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{project.title}</p>
                    <p className="text-gray-400 text-xs">{project.department}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-yellow-400 text-xs font-medium">
                      {project.endDate && new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No active projects with deadlines</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
