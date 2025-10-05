import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flag, CheckCircle2 } from "lucide-react";

interface Milestone {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: number;
}

interface Project {
  _id: string;
  title: string;
  milestones: Milestone[];
}

interface MilestoneTrackerProps {
  projects: Project[];
}

export function MilestoneTracker({ projects }: MilestoneTrackerProps) {
  return (
    <Card className="bg-white/5 backdrop-blur-md border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Flag className="w-5 h-5 text-emerald-500" />
          Milestone Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div key={project._id} className="border-l-4 border-emerald-500 pl-4">
                <h3 className="text-white font-semibold mb-3">{project.title}</h3>
                <div className="space-y-2">
                  {project.milestones?.map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                      {milestone.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-500 rounded-full flex-shrink-0"></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${milestone.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {milestone.title}
                        </p>
                        {milestone.description && (
                          <p className="text-xs text-gray-500">{milestone.description}</p>
                        )}
                      </div>
                      {milestone.dueDate && (
                        <span className="text-xs text-gray-400">
                          {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8">No projects with milestones</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
