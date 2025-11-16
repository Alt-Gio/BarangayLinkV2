"use client";

import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartsSectionProps {
  residentStats: any;
  certificateStats: any;
}

const COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

export default function ChartsSection({ residentStats, certificateStats }: ChartsSectionProps) {
  // Prepare gender data
  const genderData = [
    { name: 'Male', value: residentStats?.male || 0, color: '#3b82f6' },
    { name: 'Female', value: residentStats?.female || 0, color: '#ec4899' },
  ];

  // Prepare age group data
  const ageGroupData = residentStats?.byAgeGroup ? 
    Object.entries(residentStats.byAgeGroup).map(([name, value]) => ({
      name,
      count: value as number
    })) : [];

  // Prepare certificate type data
  const certificateTypeData = certificateStats?.byType ?
    Object.entries(certificateStats.byType)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 6)
      .map(([name, value]) => ({
        name: name.replace('Certificate of ', '').replace('Barangay ', ''),
        count: value as number
      })) : [];

  // Prepare monthly trend data (mock for now - you can add real data)
  const monthlyTrendData = [
    { month: 'Jan', certificates: 45 },
    { month: 'Feb', certificates: 52 },
    { month: 'Mar', certificates: 48 },
    { month: 'Apr', certificates: 61 },
    { month: 'May', certificates: 55 },
    { month: 'Jun', certificates: 67 },
  ];

  return (
    <div className="space-y-8">
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution Pie Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Age Groups Bar Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Population by Age Group</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ageGroupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificate Types Bar Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Certificate Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={certificateTypeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={120} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]}>
                {certificateTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Certificate Issuance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="certificates" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
