"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  User,
  Home,
  FileText,
  Heart,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface AddResidentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddResidentModal({
  open,
  onClose,
  onSuccess,
}: AddResidentModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch households
  const households = useQuery(api.households.getAllHouseholds, { limit: 100 });

  // Mutations
  const createResident = useMutation(api.residents.createResident);
  const createHousehold = useMutation(api.households.createHousehold);

  // Form state
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    nickname: "",
    birthdate: "",
    placeOfBirth: "",
    gender: "Male" as "Male" | "Female",
    civilStatus: "Single" as "Single" | "Married" | "Widowed" | "Separated" | "Annulled",
    nationality: "Filipino",
    religion: "",
    bloodType: "" as "" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-",

    // Contact
    phoneNumber: "",
    email: "",

    // Household
    householdId: "" as Id<"households"> | "",
    relationToHead: "Head" as
      | "Head"
      | "Spouse"
      | "Child"
      | "Parent"
      | "Sibling"
      | "Grandchild"
      | "Grandparent"
      | "Other Relative"
      | "Non-Relative",

    // Government IDs
    philHealthNumber: "",
    sssNumber: "",
    gsissNumber: "",
    tinNumber: "",
    votersIdNumber: "",
    nationalIdNumber: "",

    // Residency
    yearsOfResidency: 0,
    residencyType: "Owner" as "Owner" | "Renter" | "Living with Family" | "Other",
    previousAddress: "",

    // Status
    isVoter: false,
    isPWD: false,
    isIndigent: false,
    is4PsBeneficiary: false,
    isOFW: false,
    isSoloParent: false,

    // Occupation
    occupation: "",
    employer: "",
    monthlyIncome: "",
    educationalAttainment: "" as
      | ""
      | "Elementary"
      | "Elementary Graduate"
      | "High School"
      | "High School Graduate"
      | "Vocational"
      | "College"
      | "College Graduate"
      | "Post Graduate",

    // Emergency Contact
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",

    // Medical
    disabilities: [] as string[],
    medicalConditions: [] as string[],

    // Notes
    notes: "",
  });

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.birthdate || !formData.phoneNumber) {
        alert("Please fill in all required fields");
        return;
      }

      if (!formData.householdId) {
        alert("Please select a household");
        return;
      }

      // Convert birthdate to timestamp
      const birthdateTimestamp = new Date(formData.birthdate).getTime();

      await createResident({
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        suffix: formData.suffix || undefined,
        nickname: formData.nickname || undefined,
        birthdate: birthdateTimestamp,
        placeOfBirth: formData.placeOfBirth || undefined,
        gender: formData.gender,
        civilStatus: formData.civilStatus,
        nationality: formData.nationality,
        religion: formData.religion || undefined,
        bloodType: formData.bloodType || undefined,
        phoneNumber: formData.phoneNumber,
        email: formData.email || undefined,
        householdId: formData.householdId as Id<"households">,
        relationToHead: formData.relationToHead,
        philHealthNumber: formData.philHealthNumber || undefined,
        sssNumber: formData.sssNumber || undefined,
        gsissNumber: formData.gsissNumber || undefined,
        tinNumber: formData.tinNumber || undefined,
        votersIdNumber: formData.votersIdNumber || undefined,
        nationalIdNumber: formData.nationalIdNumber || undefined,
        yearsOfResidency: formData.yearsOfResidency,
        residencyType: formData.residencyType,
        previousAddress: formData.previousAddress || undefined,
        isVoter: formData.isVoter,
        isPWD: formData.isPWD,
        isIndigent: formData.isIndigent,
        is4PsBeneficiary: formData.is4PsBeneficiary,
        isOFW: formData.isOFW,
        isSoloParent: formData.isSoloParent,
        occupation: formData.occupation || undefined,
        employer: formData.employer || undefined,
        monthlyIncome: formData.monthlyIncome || undefined,
        educationalAttainment: formData.educationalAttainment || undefined,
        emergencyContactName: formData.emergencyContactName || undefined,
        emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
        emergencyContactPhone: formData.emergencyContactPhone || undefined,
        disabilities: formData.disabilities.length > 0 ? formData.disabilities : undefined,
        medicalConditions: formData.medicalConditions.length > 0 ? formData.medicalConditions : undefined,
        notes: formData.notes || undefined,
      });

      alert("✅ Resident added successfully!");
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      middleName: "",
      lastName: "",
      suffix: "",
      nickname: "",
      birthdate: "",
      placeOfBirth: "",
      gender: "Male",
      civilStatus: "Single",
      nationality: "Filipino",
      religion: "",
      bloodType: "",
      phoneNumber: "",
      email: "",
      householdId: "",
      relationToHead: "Head",
      philHealthNumber: "",
      sssNumber: "",
      gsissNumber: "",
      tinNumber: "",
      votersIdNumber: "",
      nationalIdNumber: "",
      yearsOfResidency: 0,
      residencyType: "Owner",
      previousAddress: "",
      isVoter: false,
      isPWD: false,
      isIndigent: false,
      is4PsBeneficiary: false,
      isOFW: false,
      isSoloParent: false,
      occupation: "",
      employer: "",
      monthlyIncome: "",
      educationalAttainment: "",
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      disabilities: [],
      medicalConditions: [],
      notes: "",
    });
    setStep(1);
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            Add New Resident
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Complete all steps to register a new resident
          </DialogDescription>
        </DialogHeader>

        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-6">
          {[
            { num: 1, label: "Personal", icon: User },
            { num: 2, label: "Contact & IDs", icon: FileText },
            { num: 3, label: "Status", icon: Home },
            { num: 4, label: "Review", icon: CheckCircle },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step >= s.num
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                </div>
                <p className={`text-xs mt-1 ${step >= s.num ? "text-white" : "text-gray-500"}`}>
                  {s.label}
                </p>
              </div>
              {idx < 3 && (
                <div
                  className={`h-0.5 flex-1 ${step > s.num ? "bg-blue-600" : "bg-gray-700"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label>Middle Name</Label>
                <Input
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Reyes"
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Dela Cruz"
                />
              </div>
              <div>
                <Label>Suffix</Label>
                <Input
                  value={formData.suffix}
                  onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Jr., Sr., III"
                />
              </div>
              <div>
                <Label>Nickname</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Juanito"
                />
              </div>
              <div>
                <Label>Birthdate *</Label>
                <Input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Place of Birth</Label>
                <Input
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Legazpi City"
                />
              </div>
              <div>
                <Label>Gender *</Label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <Label>Civil Status</Label>
                <select
                  value={formData.civilStatus}
                  onChange={(e) =>
                    setFormData({ ...formData, civilStatus: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Annulled">Annulled</option>
                </select>
              </div>
              <div>
                <Label>Nationality</Label>
                <Input
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>Religion</Label>
                <Input
                  value={formData.religion}
                  onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="Roman Catholic"
                />
              </div>
              <div>
                <Label>Blood Type</Label>
                <select
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact & IDs */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400">Contact & Government IDs</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone Number *</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="+639123456789"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="juan@example.com"
                />
              </div>
            </div>

            <h4 className="text-md font-semibold text-gray-300 mt-6">Government IDs</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PhilHealth Number</Label>
                <Input
                  value={formData.philHealthNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, philHealthNumber: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700"
                  placeholder="12-345678901-2"
                />
              </div>
              <div>
                <Label>SSS Number</Label>
                <Input
                  value={formData.sssNumber}
                  onChange={(e) => setFormData({ ...formData, sssNumber: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="12-3456789-0"
                />
              </div>
              <div>
                <Label>GSIS Number</Label>
                <Input
                  value={formData.gsissNumber}
                  onChange={(e) => setFormData({ ...formData, gsissNumber: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>TIN Number</Label>
                <Input
                  value={formData.tinNumber}
                  onChange={(e) => setFormData({ ...formData, tinNumber: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                  placeholder="123-456-789-000"
                />
              </div>
              <div>
                <Label>Voter's ID Number</Label>
                <Input
                  value={formData.votersIdNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, votersIdNumber: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <Label>National ID Number</Label>
                <Input
                  value={formData.nationalIdNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, nationalIdNumber: e.target.value })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Status & Household */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400">Household & Status</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Household *</Label>
                <select
                  value={formData.householdId}
                  onChange={(e) =>
                    setFormData({ ...formData, householdId: e.target.value as Id<"households"> })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="">Select Household</option>
                  {households?.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.householdNumber} - {h.houseNumber} {h.street}, {h.purok}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Relation to Head</Label>
                <select
                  value={formData.relationToHead}
                  onChange={(e) =>
                    setFormData({ ...formData, relationToHead: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                >
                  <option value="Head">Head</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Other Relative">Other Relative</option>
                  <option value="Non-Relative">Non-Relative</option>
                </select>
              </div>

              <div>
                <Label>Years of Residency</Label>
                <Input
                  type="number"
                  value={formData.yearsOfResidency}
                  onChange={(e) =>
                    setFormData({ ...formData, yearsOfResidency: parseInt(e.target.value) || 0 })
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <h4 className="text-md font-semibold text-gray-300 mt-6">Status Flags</h4>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "isVoter", label: "Voter" },
                { key: "isPWD", label: "PWD" },
                { key: "isIndigent", label: "Indigent" },
                { key: "is4PsBeneficiary", label: "4Ps Beneficiary" },
                { key: "isOFW", label: "OFW" },
                { key: "isSoloParent", label: "Solo Parent" },
              ].map((status) => (
                <label key={status.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData[status.key as keyof typeof formData] as boolean}
                    onChange={(e) =>
                      setFormData({ ...formData, [status.key]: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">{status.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-400">Review Information</h3>
            <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {formData.firstName} {formData.middleName}{" "}
                {formData.lastName} {formData.suffix}
              </p>
              <p>
                <strong>Birthdate:</strong> {formData.birthdate}
              </p>
              <p>
                <strong>Gender:</strong> {formData.gender}
              </p>
              <p>
                <strong>Phone:</strong> {formData.phoneNumber}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {[
                  formData.isVoter && "Voter",
                  formData.isPWD && "PWD",
                  formData.isIndigent && "Indigent",
                ]
                  .filter(Boolean)
                  .join(", ") || "None"}
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={step === 1 ? onClose : prevStep} disabled={isSubmitting}>
            {step === 1 ? <><X className="w-4 h-4 mr-2" />Cancel</> : <><ChevronLeft className="w-4 h-4 mr-2" />Previous</>}
          </Button>

          {step < 4 ? (
            <Button onClick={nextStep}>
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
              {isSubmitting ? "Saving..." : <>✅ Create Resident</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
