"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserCircle,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Shield,
  CheckCircle2,
  Ticket,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

export default function CompleteProfilePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [invitationCode, setInvitationCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [invitationValid, setInvitationValid] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    department: "",
    position: "",
    phone: "",
  });

  const departments = useQuery(api.departments.getAllDepartments);
  const userLevels = useQuery(api.userLevels.getAllUserLevels);

  // Validate invitation code
  const validateInvitation = async () => {
    if (!invitationCode.trim()) {
      toast.error("Please enter an invitation code");
      return;
    }

    setIsValidating(true);
    try {
      const result = await fetch("/api/validate-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: invitationCode }),
      }).then((res) => res.json());

      if (result.valid) {
        setInvitationValid(result.invitation);
        // Pre-fill form with invitation data
        setFormData({
          firstName: result.invitation.firstName || "",
          lastName: result.invitation.lastName || "",
          department: result.invitation.department || "",
          position: result.invitation.position || "",
          phone: "",
        });
        toast.success("Valid invitation! Your details have been pre-filled.");
      } else {
        setInvitationValid(null);
        toast.error(result.message || "Invalid invitation code");
      }
    } catch (error) {
      toast.error("Failed to validate invitation code");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.department || !formData.position) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Update Clerk metadata
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          firstName: formData.firstName,
          lastName: formData.lastName,
          department: formData.department,
          jobTitle: formData.position,
          position: formData.position,
          phone: formData.phone,
          invitationCode: invitationCode || undefined,
          profileCompleted: true,
        },
      });

      toast.success("Profile completed! Redirecting...");
      
      // Redirect to dashboard (ensureUserExists will create user with proper status)
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete profile");
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Fallback departments if query is loading
  const fallbackDepartments = [
    "Health Services",
    "Education",
    "Public Works",
    "Social Welfare",
    "Agriculture",
    "Youth Development",
    "Senior Citizens Affairs",
    "General Services",
  ];

  const availableDepartments = departments?.length
    ? departments
    : fallbackDepartments.map((name) => ({ name }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-800/50 border-white/10 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCircle className="w-7 h-7 text-emerald-500" />
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-gray-400">
            {invitationValid
              ? "Your invitation has been verified. Please confirm your details."
              : "Enter your invitation code or complete registration for admin approval."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Code Section */}
          {!invitationValid && (
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Ticket className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">Have an Invitation Code?</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                If you received an invitation code from an administrator, enter it below for instant access.
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter invitation code (e.g., INV-123...)"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="flex-1 bg-white/5 border-white/10 text-white"
                />
                <Button
                  onClick={validateInvitation}
                  disabled={isValidating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Validate"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Invitation Valid Badge */}
          {invitationValid && (
            <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-white font-semibold">Invitation Verified!</h3>
                  <p className="text-sm text-emerald-300">
                    Your account will be activated immediately after profile completion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Juan"
                  disabled={invitationValid}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Last Name *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Dela Cruz"
                  disabled={invitationValid}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Department *
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
                disabled={invitationValid}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept: any) => (
                    <SelectItem key={dept.name} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Position/Job Title *
              </Label>
              <Input
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="e.g., Health Worker, Community Organizer"
                disabled={invitationValid}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+63 912 345 6789"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Info Box */}
          {!invitationValid && (
            <div className="bg-yellow-600/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">Registration Pending Approval</p>
                  <p>
                    Without an invitation code, your account will be pending admin approval.
                    You'll be notified once your registration is reviewed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 text-lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {invitationValid ? "Activate Account" : "Complete Registration"}
          </Button>

          {/* Social Login Info */}
          <div className="text-center text-sm text-gray-400 border-t border-white/10 pt-4">
            Signed in with {user?.primaryEmailAddress?.emailAddress}
            {user?.externalAccounts?.[0]?.provider && (
              <span className="ml-2">
                via <span className="text-emerald-400 capitalize">
                  {user.externalAccounts[0].provider}
                </span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
