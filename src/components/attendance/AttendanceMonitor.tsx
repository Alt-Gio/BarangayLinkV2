"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  Users,
  Clock,
  TrendingUp,
  QrCode,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Camera,
  Scan,
  Sparkles,
  Hand,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";
import { QRScannerInput } from "./QRScannerInput";
import { CameraQRScanner } from "./CameraQRScanner";
import { QRCodeGenerator } from "./QRCodeGenerator";
import { ManualInviteModal } from "./ManualInviteModal";
import { LiveAttendanceDashboard } from "./LiveAttendanceDashboard";
import { SmartVisionModal } from "./SmartVisionModal";

interface AttendanceMonitorProps {
  eventId: Id<"events">;
  eventTitle: string;
}

export function AttendanceMonitor({ eventId, eventTitle }: AttendanceMonitorProps) {
  const [view, setView] = useState<"scanner" | "list" | "easyAttendance">("scanner");
  const [scannerType, setScannerType] = useState<"physical" | "camera">("physical");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showSmartVision, setShowSmartVision] = useState(false);

  const attendance = useQuery(api.attendance.getEventAttendance, { eventId });
  const recentCheckIns = useQuery(api.attendance.getRecentCheckIns, { eventId, limit: 5 });
  const liveFeed = useQuery(api.events.getLiveGuestFeed, { eventId });
  
  const checkInManual = useMutation(api.attendance.checkInManual);
  const undoCheckIn = useMutation(api.attendance.undoCheckIn);

  const filteredAttendees = attendance?.attendees.filter((a) =>
    searchTerm === "" ||
    a.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.ticketCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManualCheckIn = async (attendeeId: Id<"eventAttendees">, name: string) => {
    try {
      await checkInManual({ attendeeId });
      toast.success(`✅ ${name} checked in manually!`);
      setRefreshKey((k) => k + 1);
    } catch (error: any) {
      toast.error(error.message || "Check-in failed");
    }
  };

  const handleUndoCheckIn = async (attendeeId: Id<"eventAttendees">, name: string) => {
    if (!confirm(`Undo check-in for ${name}?`)) return;

    try {
      await undoCheckIn({ attendeeId });
      toast.success(`Check-in undone for ${name}`);
      setRefreshKey((k) => k + 1);
    } catch (error) {
      toast.error("Failed to undo check-in");
    }
  };

  if (!attendance) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-blue-300">Total</p>
              <p className="text-2xl font-bold text-white">{attendance.stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 border border-emerald-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-sm text-emerald-300">Checked In</p>
              <p className="text-2xl font-bold text-white">{attendance.stats.checkedIn}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 border border-yellow-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-yellow-300">Pending</p>
              <p className="text-2xl font-bold text-white">{attendance.stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-purple-700/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-sm text-purple-300">Attendance Rate</p>
              <p className="text-2xl font-bold text-white">
                {attendance.stats.attendanceRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle & Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg w-fit flex-wrap">
          <Button
            onClick={() => setView("scanner")}
            variant={view === "scanner" ? "default" : "ghost"}
            className={view === "scanner" ? "bg-emerald-600" : ""}
          >
            <QrCode className="w-4 h-4 mr-2" />
            Scanner
          </Button>
          <Button
            onClick={() => setView("list")}
            variant={view === "list" ? "default" : "ghost"}
            className={view === "list" ? "bg-emerald-600" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            Attendee List
          </Button>
          {liveFeed?.enableEasyAttendance && (
            <Button
              onClick={() => setView("easyAttendance")}
              variant={view === "easyAttendance" ? "default" : "ghost"}
              className={view === "easyAttendance" ? "bg-gradient-to-r from-emerald-600 to-blue-600" : ""}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Easy Attendance
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {liveFeed?.enableSmartVision && (
            <Button
              onClick={() => setShowSmartVision(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              <Hand className="w-4 h-4 mr-2" />
              Smart Vision
            </Button>
          )}
          <ManualInviteModal
            eventId={eventId}
            eventTitle={eventTitle}
            onSuccess={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>

      {/* Scanner View */}
      {view === "scanner" && (
        <>
          {/* Scanner Type Toggle */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg w-fit">
            <Button
              onClick={() => setScannerType("physical")}
              variant={scannerType === "physical" ? "default" : "ghost"}
              className={scannerType === "physical" ? "bg-emerald-600" : ""}
            >
              <Scan className="w-4 h-4 mr-2" />
              Physical Scanner
            </Button>
            <Button
              onClick={() => setScannerType("camera")}
              variant={scannerType === "camera" ? "default" : "ghost"}
              className={scannerType === "camera" ? "bg-blue-600" : ""}
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera Scanner
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {scannerType === "physical" ? (
                <QRScannerInput onSuccess={() => setRefreshKey((k) => k + 1)} />
              ) : (
                <CameraQRScanner onSuccess={() => setRefreshKey((k) => k + 1)} />
              )}
            </div>

          {/* Recent Check-Ins */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Recent Check-Ins
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {recentCheckIns && recentCheckIns.length > 0 ? (
                recentCheckIns.map((attendee) => (
                  <div
                    key={attendee._id}
                    className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg animate-in fade-in slide-in-from-right"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{attendee.userName}</p>
                      <p className="text-xs text-gray-400">
                        {attendee.checkedInAt && new Date(attendee.checkedInAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge className="bg-emerald-600 text-white">
                      {attendee.checkInMethod === "qr_scan" ? "QR" : "Manual"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No check-ins yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search attendees..."
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Attendee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Check-In Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredAttendees && filteredAttendees.length > 0 ? (
                  filteredAttendees.map((attendee) => (
                    <tr key={attendee._id} className="hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{attendee.userName}</p>
                          <p className="text-xs text-gray-400">{attendee.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {attendee.checkedInAt ? (
                          <Badge className="bg-emerald-600 text-white">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-600 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {attendee.checkedInAt ? (
                          <>
                            <p className="text-sm">
                              {new Date(attendee.checkedInAt).toLocaleTimeString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(attendee.checkedInAt).toLocaleDateString()}
                            </p>
                          </>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {attendee.checkInMethod ? (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {attendee.checkInMethod === "qr_scan" ? "QR Scan" : "Manual"}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {attendee.ticketCode && (
                            <QRCodeGenerator
                              attendeeId={attendee._id}
                              attendeeName={attendee.userName || attendee.email}
                              attendeeEmail={attendee.email}
                              eventTitle={eventTitle}
                              ticketCode={attendee.ticketCode}
                            />
                          )}
                          
                          {!attendee.checkedInAt ? (
                            <Button
                              size="sm"
                              onClick={() => handleManualCheckIn(attendee._id, attendee.userName || attendee.email)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Check In
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUndoCheckIn(attendee._id, attendee.userName || attendee.email)}
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Undo
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No attendees found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Easy Attendance View */}
      {view === "easyAttendance" && liveFeed?.enableEasyAttendance && (
        <LiveAttendanceDashboard 
          eventId={eventId} 
          eventTitle={eventTitle} 
        />
      )}

      {/* Smart Vision Modal */}
      {liveFeed?.joinCode && (
        <SmartVisionModal
          isOpen={showSmartVision}
          onClose={() => setShowSmartVision(false)}
          eventId={eventId}
          joinCode={liveFeed.joinCode}
        />
      )}
    </div>
  );
}
