"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Zap, Calendar } from 'lucide-react';

interface VelocityChartProps {
  velocityData: {
    history: {
      sprintName: string;
      startDate: number;
      endDate: number;
      committedPoints: number;
      completedPoints: number;
      completionRate: number;
    }[];
    averageVelocity: number;
    sprintCount: number;
  };
}

export function VelocityChart({ velocityData }: VelocityChartProps) {
  const { history, averageVelocity, sprintCount } = velocityData;

  if (history.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Velocity Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Complete at least one sprint to see velocity data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Chart dimensions
  const width = 800;
  const height = 350;
  const padding = { top: 40, right: 40, bottom: 80, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max points
  const maxPoints = Math.max(...history.map(s => Math.max(s.committedPoints, s.completedPoints)));
  const barWidth = chartWidth / history.length - 10;

  // Scale function
  const scaleY = (points: number) => padding.top + (1 - points / maxPoints) * chartHeight;

  // Calculate trend
  const recentAvg = history.slice(-3).reduce((sum, s) => sum + s.completedPoints, 0) / Math.min(3, history.length);
  const trend = recentAvg > averageVelocity ? 'improving' : recentAvg < averageVelocity ? 'declining' : 'stable';
  const trendColor = trend === 'improving' ? 'text-green-400' : trend === 'declining' ? 'text-red-400' : 'text-blue-400';

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Team Velocity
            </CardTitle>
            <p className="text-gray-400 text-sm">Story points completed per sprint</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-500/20 text-purple-300">
              {sprintCount} Sprints
            </Badge>
            <Badge className={`${trend === 'improving' ? 'bg-green-500/20 text-green-300' : trend === 'declining' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
              {trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'} {trend.charAt(0).toUpperCase() + trend.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Avg Velocity
            </div>
            <div className="text-xl font-bold text-purple-400">{averageVelocity} pts</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Recent (Last 3)</div>
            <div className={`text-xl font-bold ${trendColor}`}>{Math.round(recentAvg)} pts</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Best Sprint</div>
            <div className="text-xl font-bold text-green-400">
              {Math.max(...history.map(s => s.completedPoints))} pts
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Avg Completion</div>
            <div className="text-xl font-bold text-blue-400">
              {Math.round(history.reduce((sum, s) => sum + s.completionRate, 0) / history.length)}%
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = scaleY(maxPoints * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#374151"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 5}
                    textAnchor="end"
                    fill="#9CA3AF"
                    fontSize="12"
                  >
                    {Math.round(maxPoints * ratio)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {history.map((sprint, index) => {
              const x = padding.left + (index * chartWidth / history.length) + 5;
              const committedHeight = chartHeight * (sprint.committedPoints / maxPoints);
              const completedHeight = chartHeight * (sprint.completedPoints / maxPoints);
              
              return (
                <g key={sprint.sprintName}>
                  {/* Committed (background) */}
                  <rect
                    x={x}
                    y={scaleY(sprint.committedPoints)}
                    width={barWidth}
                    height={committedHeight}
                    fill="#374151"
                    rx="4"
                  />
                  
                  {/* Completed (foreground) */}
                  <rect
                    x={x}
                    y={scaleY(sprint.completedPoints)}
                    width={barWidth}
                    height={completedHeight}
                    fill={sprint.completedPoints >= sprint.committedPoints ? '#10B981' : '#F59E0B'}
                    rx="4"
                  />

                  {/* Completion rate label */}
                  <text
                    x={x + barWidth / 2}
                    y={scaleY(sprint.completedPoints) - 5}
                    textAnchor="middle"
                    fill={sprint.completedPoints >= sprint.committedPoints ? '#10B981' : '#F59E0B'}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {sprint.completionRate}%
                  </text>

                  {/* Sprint name */}
                  <text
                    x={x + barWidth / 2}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="11"
                    transform={`rotate(-45, ${x + barWidth / 2}, ${height - padding.bottom + 20})`}
                  >
                    {sprint.sprintName.length > 15 
                      ? sprint.sprintName.substring(0, 12) + '...' 
                      : sprint.sprintName}
                  </text>
                </g>
              );
            })}

            {/* Average line */}
            <line
              x1={padding.left}
              y1={scaleY(averageVelocity)}
              x2={width - padding.right}
              y2={scaleY(averageVelocity)}
              stroke="#A855F7"
              strokeWidth="2"
              strokeDasharray="8,4"
            />
            <text
              x={width - padding.right + 5}
              y={scaleY(averageVelocity) - 5}
              fill="#A855F7"
              fontSize="12"
              fontWeight="bold"
            >
              Avg: {averageVelocity}
            </text>

            {/* Legend */}
            <g transform={`translate(${padding.left}, ${padding.top - 25})`}>
              <rect x="0" y="0" width="15" height="15" fill="#374151" rx="2" />
              <text x="20" y="12" fill="#9CA3AF" fontSize="12">Committed</text>
              <rect x="110" y="0" width="15" height="15" fill="#10B981" rx="2" />
              <text x="130" y="12" fill="#9CA3AF" fontSize="12">Completed</text>
              <line x1="230" y1="7" x2="250" y2="7" stroke="#A855F7" strokeWidth="2" strokeDasharray="4,2" />
              <text x="255" y="12" fill="#9CA3AF" fontSize="12">Average</text>
            </g>

            {/* Axes */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={height - padding.bottom}
              stroke="#4B5563"
              strokeWidth="2"
            />
            <line
              x1={padding.left}
              y1={height - padding.bottom}
              x2={width - padding.right}
              y2={height - padding.bottom}
              stroke="#4B5563"
              strokeWidth="2"
            />

            {/* Axis labels */}
            <text
              x={20}
              y={height / 2}
              textAnchor="middle"
              fill="#D1D5DB"
              fontSize="14"
              fontWeight="bold"
              transform={`rotate(-90, 20, ${height / 2})`}
            >
              Story Points
            </text>
          </svg>
        </div>

        {/* Sprint Details */}
        <div className="mt-4 space-y-2">
          {history.slice().reverse().map((sprint, index) => (
            <div 
              key={sprint.sprintName}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">{sprint.sprintName}</h4>
                  <p className="text-xs text-gray-400">
                    {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Completed</div>
                    <div className="text-lg font-bold text-green-400">{sprint.completedPoints}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Committed</div>
                    <div className="text-lg font-bold text-gray-300">{sprint.committedPoints}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Rate</div>
                    <div className={`text-lg font-bold ${sprint.completionRate >= 100 ? 'text-green-400' : 'text-orange-400'}`}>
                      {sprint.completionRate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Planning Recommendations
          </h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Plan next sprint capacity: <span className="font-bold text-white">{averageVelocity} points</span></li>
            <li>• Recent trend: Team velocity is <span className={`font-bold ${trendColor}`}>{trend}</span></li>
            <li>• Completion rate: Aim for 100% by planning {averageVelocity} points or fewer</li>
            {trend === 'improving' && <li>• 🎉 Great job! Team is getting faster over time</li>}
            {trend === 'declining' && <li>• ⚠️ Consider reducing sprint scope to improve completion rate</li>}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
