import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, CheckCircle2, Flag, Activity, Briefcase, Target, Clock } from "lucide-react";

interface MetricsCardsProps {
  totalProjects: number;
  completionRate: string;
  completedProjects: number;
  milestoneCompletionRate: string;
  completedMilestones: number;
  totalMilestones: number;
  onTimeRate: string;
  onTimeProjects: number;
}

export function MetricsCards({
  totalProjects, completionRate, completedProjects, milestoneCompletionRate,
  completedMilestones, totalMilestones, onTimeRate, onTimeProjects
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-400 text-sm font-medium">Total Projects</p>
              <p className="text-3xl font-bold text-white mt-2">{totalProjects}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs">+12% from last month</span>
              </div>
            </div>
            <Briefcase className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border-emerald-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold text-white mt-2">{completionRate}%</p>
              <div className="flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs">{completedProjects} completed</span>
              </div>
            </div>
            <Target className="w-12 h-12 text-emerald-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-400 text-sm font-medium">Milestone Progress</p>
              <p className="text-3xl font-bold text-white mt-2">{milestoneCompletionRate}%</p>
              <div className="flex items-center gap-1 mt-2">
                <Flag className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 text-xs">{completedMilestones}/{totalMilestones} done</span>
              </div>
            </div>
            <Flag className="w-12 h-12 text-purple-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-400 text-sm font-medium">On-Time Delivery</p>
              <p className="text-3xl font-bold text-white mt-2">{onTimeRate}%</p>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-xs">{onTimeProjects} on schedule</span>
              </div>
            </div>
            <Activity className="w-12 h-12 text-yellow-500 opacity-50" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
