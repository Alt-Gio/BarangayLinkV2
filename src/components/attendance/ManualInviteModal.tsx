"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Mail, X, Plus, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface ManualInviteModalProps {
  eventId: Id<"events">;
  eventTitle: string;
  onSuccess?: () => void;
}

interface InviteeData {
  firstName: string;
  lastName: string;
  email: string;
}

export function ManualInviteModal({ eventId, eventTitle, onSuccess }: ManualInviteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [invitees, setInvitees] = useState<InviteeData[]>([{ firstName: "", lastName: "", email: "" }]);
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);

  const addAttendee = useMutation(api.eventAttendees.addAttendeeManual);

  const handleAddRow = () => {
    setInvitees([...invitees, { firstName: "", lastName: "", email: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (invitees.length > 1) {
      setInvitees(invitees.filter((_, i) => i !== index));
    }
  };

  const handleInviteeChange = (index: number, field: keyof InviteeData, value: string) => {
    const updated = [...invitees];
    updated[index][field] = value;
    setInvitees(updated);
  };

  const handleBulkImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    const lines = text.split("\n").filter((line) => line.trim());

    const imported: InviteeData[] = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        firstName: parts[0] || "",
        lastName: parts[1] || "",
        email: parts[2] || "",
      };
    });

    if (imported.length > 0) {
      setInvitees(imported);
      toast.success(`Imported ${imported.length} attendees`);
    }
  };

  const handleSendInvites = async () => {
    // Validate
    const validInvitees = invitees.filter(
      (inv) => inv.firstName && inv.lastName && inv.email && inv.email.includes("@")
    );

    if (validInvitees.length === 0) {
      toast.error("Please add at least one valid attendee");
      return;
    }

    setSending(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const invitee of validInvitees) {
        try {
          // Add attendee to database
          const result = await addAttendee({
            eventId,
            firstName: invitee.firstName,
            lastName: invitee.lastName,
            email: invitee.email,
            customMessage: customMessage || undefined,
          });

          // Send invitation email with QR/barcode
          await fetch("/api/send-invitation-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              attendeeId: result.attendeeId,
              attendeeName: `${invitee.firstName} ${invitee.lastName}`,
              attendeeEmail: invitee.email,
              eventTitle,
              customMessage,
              ticketCode: result.ticketCode,
            }),
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to invite ${invitee.email}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Sent ${successCount} invitation(s)!`);
        setInvitees([{ firstName: "", lastName: "", email: "" }]);
        setCustomMessage("");
        setIsOpen(false);
        onSuccess?.();
      }

      if (errorCount > 0) {
        toast.error(`⚠️ Failed to send ${errorCount} invitation(s)`);
      }
    } catch (error) {
      console.error("Invite error:", error);
      toast.error("Failed to send invitations");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Invite Attendees
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-400" />
            Invite Attendees to {eventTitle}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Add attendees manually and send them QR code invitations via email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Bulk Import Helper */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Quick Import (Optional)
            </h4>
            <Textarea
              placeholder="Paste CSV format: FirstName, LastName, Email&#10;John, Doe, john@example.com&#10;Jane, Smith, jane@example.com"
              className="bg-gray-900 border-gray-700 text-white text-sm font-mono h-20"
              onChange={handleBulkImport}
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: FirstName, LastName, Email (one per line)
            </p>
          </div>

          {/* Invitee List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300 font-semibold">Attendees</Label>
              <Badge className="bg-blue-600 text-white">
                {invitees.filter((i) => i.email).length} to invite
              </Badge>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {invitees.map((invitee, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg"
                >
                  <div className="col-span-3">
                    <Input
                      placeholder="First Name"
                      value={invitee.firstName}
                      onChange={(e) => handleInviteeChange(index, "firstName", e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Last Name"
                      value={invitee.lastName}
                      onChange={(e) => handleInviteeChange(index, "lastName", e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white text-sm"
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={invitee.email}
                      onChange={(e) => handleInviteeChange(index, "email", e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveRow(index)}
                      disabled={invitees.length === 1}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleAddRow}
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Attendee
            </Button>
          </div>

          {/* Custom Message */}
          <div>
            <Label className="text-gray-300 mb-2 block">
              Custom Message (Optional)
            </Label>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to your invitation email..."
              className="bg-gray-800 border-gray-700 text-white min-h-24"
            />
            <p className="text-xs text-gray-500 mt-1">
              This message will be included in the invitation email along with the QR code
            </p>
          </div>

          {/* Preview */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">📧 What they'll receive:</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Event invitation with details</li>
              <li>• QR code for quick check-in</li>
              <li>• Barcode as alternative</li>
              <li>• Your custom message (if added)</li>
              <li>• Instructions for event day</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={sending || invitees.filter((i) => i.email).length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send {invitees.filter((i) => i.email).length} Invitation(s)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
