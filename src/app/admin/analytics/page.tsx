"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Users,
  Home,
  FileText,
  TrendingUp,
  Calendar,
  UserCheck,
  Award,
  Activity,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { exportAnalyticsReport } from "@/lib/export/exportUtils";
import ChartsSection from "@/components/analytics/ChartsSection";

export default function AnalyticsPage() {
  // Fetch statistics
  const residentStats = useQuery(api.residents.getResidentStats);
  const householdStats = useQuery(api.households.getHouseholdStats);
  const certificateStats = useQuery(api.certificateRequests.getRequestStats);
  const certIssuedStats = useQuery(api.certificates.getCertificateStats);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-500" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Overview of barangay statistics and insights</p>
          </div>
          <Button
            onClick={() => exportAnalyticsReport({
              residentStats,
              householdStats,
              certificateStats
            })}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Analytics Report
          </Button>
        </div>
      </div>

      {/* Population Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-500" />
          Population Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-500" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm">Total Residents</p>
            <p className="text-4xl font-bold text-white">{residentStats?.totalResidents || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Registered in barangay</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Home className="w-8 h-8 text-emerald-500" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-gray-400 text-sm">Total Households</p>
            <p className="text-4xl font-bold text-white">{householdStats?.totalHouseholds || 0}</p>
            <p className="text-xs text-gray-500 mt-2">Family units</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <UserCheck className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-400 text-sm">Senior Citizens</p>
            <p className="text-4xl font-bold text-white">{residentStats?.seniors || 0}</p>
            <p className="text-xs text-gray-500 mt-2">
              {residentStats?.totalResidents ? 
                Math.round((residentStats.seniors / residentStats.totalResidents) * 100) : 0}% of total
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-gray-400 text-sm">Certificates Issued</p>
            <p className="text-4xl font-bold text-white">{certIssuedStats?.totalCertificates || 0}</p>
            <p className="text-xs text-gray-500 mt-2">
              {certIssuedStats?.thisMonthCount || 0} this month
            </p>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-500" />
          Demographics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Gender Distribution */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Gender Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Male</span>
                  <span className="text-sm text-white font-semibold">{residentStats?.males || 0}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        residentStats?.totalResidents
                          ? (residentStats.males / residentStats.totalResidents) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Female</span>
                  <span className="text-sm text-white font-semibold">{residentStats?.females || 0}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{
                      width: `${
                        residentStats?.totalResidents
                          ? (residentStats.females / residentStats.totalResidents) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Age Groups */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Age Groups</h3>
            <div className="space-y-3">
              {residentStats?.ageGroups && Object.entries(residentStats.ageGroups).map(([group, count]) => (
                <div key={group}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">{group}</span>
                    <span className="text-sm text-white font-semibold">{count as number}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${
                          residentStats.totalResidents
                            ? ((count as number) / residentStats.totalResidents) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Categories */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Special Categories</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-400">Senior Citizens</span>
                </div>
                <span className="text-lg font-bold text-white">{residentStats?.seniors || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-400">PWD</span>
                </div>
                <span className="text-lg font-bold text-white">{residentStats?.pwd || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-400">Voters</span>
                </div>
                <span className="text-lg font-bold text-white">{residentStats?.voters || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-400">OFW</span>
                </div>
                <span className="text-lg font-bold text-white">{residentStats?.ofw || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Household Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Home className="w-6 h-6 text-emerald-500" />
          Household Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Home className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Indigent Families</p>
                <p className="text-2xl font-bold text-white">{householdStats?.indigentHouseholds || 0}</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{
                  width: `${
                    householdStats?.totalHouseholds
                      ? (householdStats.indigentHouseholds / householdStats.totalHouseholds) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {householdStats?.totalHouseholds
                ? Math.round((householdStats.indigentHouseholds / householdStats.totalHouseholds) * 100)
                : 0}
              % of households
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Award className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">4Ps Beneficiaries</p>
                <p className="text-2xl font-bold text-white">{householdStats?.fourPsBeneficiaries || 0}</p>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${
                    householdStats?.totalHouseholds
                      ? (householdStats.fourPsBeneficiaries / householdStats.totalHouseholds) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {householdStats?.totalHouseholds
                ? Math.round((householdStats.fourPsBeneficiaries / householdStats.totalHouseholds) * 100)
                : 0}
              % of households
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Members</p>
                <p className="text-2xl font-bold text-white">
                  {householdStats?.totalHouseholds
                    ? ((residentStats?.totalResidents || 0) / householdStats.totalHouseholds).toFixed(1)
                    : 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Average household size</p>
          </div>
        </div>
      </div>

      {/* Certificate Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-500" />
          Certificate Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Certificate Requests Status */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Request Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-400">Pending</span>
                </div>
                <span className="text-lg font-bold text-white">{certificateStats?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-400">Approved</span>
                </div>
                <span className="text-lg font-bold text-white">{certificateStats?.approved || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-400">Released</span>
                </div>
                <span className="text-lg font-bold text-white">{certificateStats?.released || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-400">Rejected</span>
                </div>
                <span className="text-lg font-bold text-white">{certificateStats?.rejected || 0}</span>
              </div>
            </div>
          </div>

          {/* Certificate Types */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">By Certificate Type</h3>
            <div className="space-y-3">
              {certificateStats?.byType && Object.entries(certificateStats.byType)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-400">{type}</span>
                      <span className="text-sm text-white font-semibold">{count as number}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${
                            certificateStats.totalRequests
                              ? ((count as number) / certificateStats.totalRequests) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <ChartsSection residentStats={residentStats} certificateStats={certificateStats} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border border-cyan-500/20 rounded-lg p-4 text-center">
          <Calendar className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{certIssuedStats?.thisMonthCount || 0}</p>
          <p className="text-xs text-gray-400">Certificates This Month</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4 text-center">
          <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{certIssuedStats?.validCertificates || 0}</p>
          <p className="text-xs text-gray-400">Valid Certificates</p>
        </div>
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg p-4 text-center">
          <FileText className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{certIssuedStats?.invalidatedCertificates || 0}</p>
          <p className="text-xs text-gray-400">Invalidated</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4 text-center">
          <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{certificateStats?.totalRequests || 0}</p>
          <p className="text-xs text-gray-400">Total Requests</p>
        </div>
      </div>
    </div>
  );
}
