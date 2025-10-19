"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

interface TeamWorkloadViewProps {
  teamData: {
    team: Array<{
      userId: string;
      userName: string;
      email: string;
      imageUrl?: string;
      tasksCount: number;
      storyPoints: number;
      status: 'healthy' | 'moderate' | 'heavy' | 'critical';
      department?: string;
    }>;
    totalTeamPoints: number;
    avgPointsPerPerson: number;
    overloadedMembers: number;
    healthyMembers: number;
  };
}

const statusConfig = {
  healthy: {
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    label: 'Healthy',
    icon: CheckCircle,
  },
  moderate: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    label: 'Moderate',
    icon: TrendingUp,
  },
  heavy: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    label: 'Heavy',
    icon: AlertTriangle,
  },
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-500/30',
    label: 'Critical',
    icon: AlertTriangle,
  },
};

export function TeamWorkloadView({ teamData }: TeamWorkloadViewProps) {
  const maxPoints = Math.max(...teamData.team.map(m => m.storyPoints), 1);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Team Workload Overview
            </CardTitle>
            <p className="text-sm text-gray-400 mt-1">
              Monitor team capacity and prevent burnout
            </p>
          </div>
          <div className="flex items-center gap-2">
            {teamData.overloadedMembers > 0 && (
              <Badge className="bg-red-500/20 text-red-300">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {teamData.overloadedMembers} Overloaded
              </Badge>
            )}
            <Badge className="bg-green-500/20 text-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              {teamData.healthyMembers} Healthy
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Team Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Total Points</div>
            <div className="text-2xl font-bold text-white">{teamData.totalTeamPoints}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Average/Person</div>
            <div className="text-2xl font-bold text-blue-400">{teamData.avgPointsPerPerson}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Team Members</div>
            <div className="text-2xl font-bold text-purple-400">{teamData.team.length}</div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="space-y-3">
          {teamData.team.length > 0 ? (
            teamData.team.map((member) => {
              const config = statusConfig[member.status];
              const StatusIcon = config.icon;
              const utilization = (member.storyPoints / maxPoints) * 100;

              return (
                <div
                  key={member.userId}
                  className={`${config.bg} border ${config.border} rounded-lg p-4 hover:scale-[1.01] transition-transform`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 border-2 border-gray-600">
                      <AvatarImage src={member.imageUrl} />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {member.userName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-semibold truncate">
                          {member.userName}
                        </h4>
                        <Badge className={`${config.bg} ${config.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        {member.department && (
                          <Badge className="bg-gray-700 text-gray-300 text-xs">
                            {member.department}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{member.email}</span>
                        <span>•</span>
                        <span>{member.tasksCount} tasks today</span>
                      </div>

                      {/* Workload Bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-400">Workload</span>
                          <span className={`text-sm font-bold ${config.color}`}>
                            {member.storyPoints} pts
                          </span>
                        </div>
                        <Progress 
                          value={utilization} 
                          className={`h-2 ${member.status === 'critical' ? 'bg-red-900' : 'bg-gray-700'}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Warning Messages */}
                  {member.status === 'critical' && (
                    <div className="mt-3 p-2 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-300">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Critical workload! Consider reassigning tasks or extending deadlines.
                    </div>
                  )}
                  {member.status === 'heavy' && (
                    <div className="mt-3 p-2 bg-orange-900/30 border border-orange-500/30 rounded text-xs text-orange-300">
                      Heavy workload. Monitor progress and be ready to help.
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No team members found</p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {teamData.overloadedMembers > 0 && (
          <div className="mt-6 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h4 className="text-red-300 font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Action Required
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• {teamData.overloadedMembers} team member(s) critically overloaded</li>
              <li>• Consider redistributing tasks across the team</li>
              <li>• Extend sprint deadline if needed</li>
              <li>• Remove low-priority items from sprint</li>
              <li>• Schedule 1-on-1s to discuss workload</li>
            </ul>
          </div>
        )}

        {/* Workload Distribution Chart */}
        <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Workload Distribution
          </h4>
          <div className="space-y-2">
            {Object.entries(statusConfig).map(([status, config]) => {
              const count = teamData.team.filter(m => m.status === status).length;
              const percentage = (count / teamData.team.length) * 100;
              
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-gray-400 capitalize">{config.label}</div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <div className={`w-16 text-sm font-medium ${config.color} text-right`}>
                    {count} ({percentage.toFixed(0)}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
