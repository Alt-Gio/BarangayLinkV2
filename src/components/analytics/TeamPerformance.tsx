import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  projects: number;
  completed: number;
}

interface TeamPerformanceProps {
  teamStats: TeamMember[];
}

export function TeamPerformance({ teamStats }: TeamPerformanceProps) {
  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {teamStats.map((member, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${idx === 0 ? 'bg-yellow-600' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-600'}`}>
                  <span className="text-white font-bold">#{idx + 1}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{member.name}</p>
                  <Badge className="bg-gray-700 text-gray-300 text-xs">{member.role}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">{member.completed} Completed</p>
                <p className="text-gray-400 text-sm">{member.projects} Total Projects</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
