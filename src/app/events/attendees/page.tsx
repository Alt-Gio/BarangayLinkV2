"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Mail,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Menu,
  Send,
  RefreshCw,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";
import { AttendanceMonitor } from "@/components/attendance/AttendanceMonitor";

export default function EventAttendeesPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Id<"events"> | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailType, setEmailType] = useState<"confirmation" | "reminder" | "update" | "cancellation">("reminder");

  const eventsWithAttendees = useQuery(api.eventAttendees.getAllEventsWithAttendees);
  const selectedEventAttendees = useQuery(
    api.eventAttendees.getEventAttendees,
    selectedEvent ? { eventId: selectedEvent } : "skip"
  );
  const attendeeStats = useQuery(
    api.eventAttendees.getAttendeeStats,
    selectedEvent ? { eventId: selectedEvent } : "skip"
  );

  const sendBulkNotification = useMutation(api.eventAttendees.sendBulkEventNotification);
  const updateRSVPStatus = useMutation(api.eventAttendees.updateRSVPStatus);
  const updateAttendanceStatus = useMutation(api.eventAttendees.updateAttendanceStatus);
  const deleteAttendee = useMutation(api.eventAttendees.deleteAttendee);

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !eventsWithAttendees) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading attendees...</p>
        </div>
      </div>
    );
  }

  const selectedEventData = eventsWithAttendees.find((e) => e._id === selectedEvent);

  const filteredAttendees = selectedEventAttendees?.filter((attendee) => {
    const matchesSearch =
      searchTerm === "" ||
      attendee.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.ticketCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || attendee.rsvpStatus === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleSendBulkEmail = async () => {
    if (!selectedEvent) return;

    try {
      const filterStatusValue = filterStatus === "all" ? undefined : filterStatus as any;
      
      await sendBulkNotification({
        eventId: selectedEvent,
        emailType,
        filterStatus: filterStatusValue,
      });

      toast.success(`${emailType} emails sent successfully!`);
      setShowEmailModal(false);
    } catch (error) {
      toast.error("Failed to send emails");
      console.error(error);
    }
  };

  const handleUpdateRSVP = async (attendeeId: Id<"eventAttendees">, status: any) => {
    try {
      await updateRSVPStatus({ attendeeId, status });
      toast.success("RSVP status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleCheckIn = async (attendeeId: Id<"eventAttendees">) => {
    try {
      await updateAttendanceStatus({ attendeeId, status: "attended" });
      toast.success("Attendee checked in");
    } catch (error) {
      toast.error("Failed to check in");
    }
  };

  const handleDeleteAttendee = async (attendeeId: Id<"eventAttendees">) => {
    if (confirm("Are you sure you want to remove this attendee?")) {
      try {
        await deleteAttendee({ attendeeId });
        toast.success("Attendee removed");
      } catch (error) {
        toast.error("Failed to remove attendee");
      }
    }
  };

  const exportToCSV = () => {
    if (!filteredAttendees || filteredAttendees.length === 0) {
      toast.error("No attendees to export");
      return;
    }

    const headers = ["Name", "Email", "Phone", "RSVP Status", "Attendance Status", "Ticket Code", "Registered At"];
    const rows = filteredAttendees.map((a) => [
      a.userName || `${a.firstName} ${a.lastName}`,
      a.email,
      a.phone || "N/A",
      a.rsvpStatus,
      a.attendanceStatus || "N/A",
      a.ticketCode || "N/A",
      new Date(a.registeredAt).toLocaleString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedEventData?.title || "event"}-attendees.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-600";
      case "pending":
        return "bg-yellow-600";
      case "declined":
        return "bg-red-600";
      case "maybe":
        return "bg-blue-600";
      case "waitlist":
        return "bg-purple-600";
      case "attended":
        return "bg-green-600";
      case "no-show":
        return "bg-orange-600";
      case "cancelled":
        return "bg-gray-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar
        userRole="ADMIN"
        dashboardTitle="Event Attendees"
        dashboardSubtitle="Manage event participation"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-800 p-4 flex items-center justify-between z-10 border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Event Attendees</h1>
          <div className="w-9" />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8 mt-16 md:mt-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                  <Users className="w-8 h-8 text-emerald-500" />
                  Event Participation
                </h1>
                <p className="text-gray-400 mt-1">Manage attendees and send notifications</p>
              </div>
            </div>

            {/* Event Selection */}
            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                Select Event
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventsWithAttendees.map((event) => (
                  <button
                    key={event._id}
                    onClick={() => setSelectedEvent(event._id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedEvent === event._id
                        ? "border-emerald-500 bg-emerald-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <h3 className="font-semibold text-white mb-2 line-clamp-1">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-600 text-white">
                        {event.attendeeCount} Total
                      </Badge>
                      <Badge className="bg-emerald-600 text-white">
                        {event.confirmedCount} Confirmed
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Attendee Management - NEW INTEGRATED SYSTEM */}
            {selectedEvent && selectedEventData && (
              <AttendanceMonitor
                eventId={selectedEvent}
                eventTitle={selectedEventData.title}
              />
            )}

            {/* Legacy Attendee Management (Keep for fallback) */}
            {selectedEvent && selectedEventData && false && (
              <>
                {/* Stats Cards */}
                {attendeeStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4">
                      <p className="text-blue-100 text-sm">Total</p>
                      <p className="text-3xl font-bold text-white">{attendeeStats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-4">
                      <p className="text-emerald-100 text-sm">Confirmed</p>
                      <p className="text-3xl font-bold text-white">{attendeeStats.confirmed}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-lg p-4">
                      <p className="text-yellow-100 text-sm">Pending</p>
                      <p className="text-3xl font-bold text-white">{attendeeStats.pending}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4">
                      <p className="text-green-100 text-sm">Attended</p>
                      <p className="text-3xl font-bold text-white">{attendeeStats.attended}</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4">
                      <p className="text-orange-100 text-sm">No-Show</p>
                      <p className="text-3xl font-bold text-white">{attendeeStats.noShow}</p>
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4">
                  <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by name, email, or ticket code..."
                        className="pl-10 bg-gray-700 border-gray-600 text-white"
                      />
                    </div>

                    {/* Filter */}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    >
                      <option value="all">All Status</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="declined">Declined</option>
                      <option value="maybe">Maybe</option>
                      <option value="waitlist">Waitlist</option>
                    </select>

                    {/* Actions */}
                    <Button
                      onClick={() => setShowEmailModal(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Emails
                    </Button>
                    <Button
                      onClick={exportToCSV}
                      variant="outline"
                      className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Attendees List */}
                <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-500" />
                      Attendees for {selectedEventData.title}
                      <Badge className="bg-gray-700 text-white ml-2">
                        {filteredAttendees?.length || 0}
                      </Badge>
                    </h2>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            Attendee
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            RSVP Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            Attendance
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            Ticket Code
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            Registered
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {filteredAttendees && filteredAttendees.length > 0 ? (
                          filteredAttendees.map((attendee) => (
                            <tr key={attendee._id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
                                    {attendee.userName?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">{attendee.userName}</p>
                                    {attendee.isPublicRSVP && (
                                      <Badge className="bg-purple-600 text-white text-xs mt-1">
                                        Public RSVP
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-gray-300 text-sm">{attendee.email}</p>
                                {attendee.phone && (
                                  <p className="text-gray-400 text-xs">{attendee.phone}</p>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={attendee.rsvpStatus}
                                  onChange={(e) => handleUpdateRSVP(attendee._id, e.target.value)}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                    attendee.rsvpStatus
                                  )} text-white`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="declined">Declined</option>
                                  <option value="maybe">Maybe</option>
                                  <option value="waitlist">Waitlist</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                {attendee.attendanceStatus ? (
                                  <Badge className={`${getStatusColor(attendee.attendanceStatus)} text-white`}>
                                    {attendee.attendanceStatus}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500 text-sm">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <code className="text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded">
                                  {attendee.ticketCode}
                                </code>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-gray-300 text-sm">
                                  {new Date(attendee.registeredAt).toLocaleDateString()}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {new Date(attendee.registeredAt).toLocaleTimeString()}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  {!attendee.attendanceStatus && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleCheckIn(attendee._id)}
                                      className="bg-green-600 hover:bg-green-700"
                                      title="Check In"
                                    >
                                      <UserCheck className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteAttendee(attendee._id)}
                                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                              <p className="text-gray-400">No attendees found</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Send Event Notification
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Email Type</label>
                <select
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="confirmation">Confirmation</option>
                  <option value="reminder">Reminder</option>
                  <option value="update">Update</option>
                  <option value="cancellation">Cancellation</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Send To</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">All Attendees</option>
                  <option value="confirmed">Confirmed Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="maybe">Maybe Only</option>
                </select>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-300">
                  This will send <span className="font-semibold">{emailType}</span> emails to{" "}
                  {filterStatus === "all"
                    ? "all attendees"
                    : `attendees with "${filterStatus}" status`}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowEmailModal(false)}
                variant="outline"
                className="flex-1 border-gray-600 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendBulkEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Emails
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
