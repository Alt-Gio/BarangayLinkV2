"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Calendar, Target, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BurndownChartProps {
  burndownData: {
    sprintName: string;
    totalPoints: number;
    completedPoints: number;
    remainingPoints: number;
    burndown: {
      day: number;
      date: number;
      ideal: number;
      actual: number | null;
    }[];
  };
}

export function BurndownChart({ burndownData }: BurndownChartProps) {
  const { sprintName, totalPoints, completedPoints, remainingPoints, burndown } = burndownData;

  // Calculate chart dimensions
  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 60, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max values
  const maxDay = Math.max(...burndown.map(d => d.day));
  const maxPoints = Math.max(...burndown.map(d => d.ideal));

  // Scale functions
  const scaleX = (day: number) => padding.left + (day / maxDay) * chartWidth;
  const scaleY = (points: number) => padding.top + (1 - points / maxPoints) * chartHeight;

  // Generate paths
  const idealPath = burndown
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.day)} ${scaleY(d.ideal)}`)
    .join(' ');

  const actualPoints = burndown.filter(d => d.actual !== null);
  const actualPath = actualPoints.length > 0
    ? actualPoints
        .map((d, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(d.day)} ${scaleY(d.actual!)}`)
        .join(' ')
    : '';

  // Calculate if on track
  const today = burndown.findIndex(d => d.actual !== null && burndown[d.day + 1]?.actual === null);
  const todayData = today >= 0 ? burndown[today] : burndown[burndown.length - 1];
  const isOnTrack = todayData.actual !== null && todayData.actual <= todayData.ideal;
  const variance = todayData.actual !== null ? todayData.actual - todayData.ideal : 0;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-purple-400" />
            Sprint Burndown Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={isOnTrack ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'}>
              {isOnTrack ? '✅ On Track' : '⚠️ Behind Schedule'}
            </Badge>
          </div>
        </div>
        <p className="text-gray-400 text-sm">{sprintName}</p>
      </CardHeader>
      
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Total Points
            </div>
            <div className="text-xl font-bold text-white">{totalPoints}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Completed
            </div>
            <div className="text-xl font-bold text-green-400">{completedPoints}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Remaining
            </div>
            <div className="text-xl font-bold text-orange-400">{remainingPoints}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">Variance</div>
            <div className={`text-xl font-bold ${variance > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {variance > 0 ? '+' : ''}{Math.round(variance)} pts
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

            {/* X-axis labels */}
            {burndown.filter((_, i) => i % Math.ceil(burndown.length / 7) === 0).map((d) => (
              <text
                key={d.day}
                x={scaleX(d.day)}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="12"
              >
                Day {d.day}
              </text>
            ))}

            {/* Ideal line */}
            <path
              d={idealPath}
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Actual line */}
            {actualPath && (
              <path
                d={actualPath}
                fill="none"
                stroke={isOnTrack ? '#10B981' : '#F59E0B'}
                strokeWidth="3"
              />
            )}

            {/* Points */}
            {actualPoints.map((d) => (
              <circle
                key={d.day}
                cx={scaleX(d.day)}
                cy={scaleY(d.actual!)}
                r="4"
                fill={d.actual! <= d.ideal ? '#10B981' : '#F59E0B'}
                stroke="#1F2937"
                strokeWidth="2"
              />
            ))}

            {/* Legend */}
            <g transform={`translate(${width - padding.right - 120}, ${padding.top})`}>
              <rect x="0" y="0" width="100" height="50" fill="#1F2937" rx="4" />
              <line x1="10" y1="15" x2="30" y2="15" stroke="#6B7280" strokeWidth="2" strokeDasharray="5,5" />
              <text x="35" y="19" fill="#9CA3AF" fontSize="12">Ideal</text>
              <line x1="10" y1="35" x2="30" y2="35" stroke="#10B981" strokeWidth="3" />
              <text x="35" y="39" fill="#9CA3AF" fontSize="12">Actual</text>
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
              x={width / 2}
              y={height - 10}
              textAnchor="middle"
              fill="#D1D5DB"
              fontSize="14"
              fontWeight="bold"
            >
              Sprint Days
            </text>
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

        {/* Analysis */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <h4 className="text-blue-300 font-semibold mb-2">Insights</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Completion Rate: {totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}%</li>
              <li>• Average Velocity: {Math.round(completedPoints / Math.max(1, actualPoints.length))} pts/day</li>
              <li>• Trend: {isOnTrack ? 'Ahead of' : 'Behind'} schedule by {Math.abs(Math.round(variance))} pts</li>
            </ul>
          </div>
          <div className={`${isOnTrack ? 'bg-green-900/20 border-green-500/30' : 'bg-orange-900/20 border-orange-500/30'} border rounded-lg p-3`}>
            <h4 className={`${isOnTrack ? 'text-green-300' : 'text-orange-300'} font-semibold mb-2`}>
              {isOnTrack ? 'Sprint Health' : 'Action Needed'}
            </h4>
            <p className="text-sm text-gray-300">
              {isOnTrack 
                ? 'Team is on track to complete sprint goals. Keep up the great work!'
                : 'Team is falling behind schedule. Consider adjusting scope or increasing velocity.'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
