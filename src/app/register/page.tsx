"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSignUp, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  Building2, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Briefcase,
  CheckCircle,
  ChevronDown,
  Mail,
  Phone,
  User,
  Lock,
  Users,
  Hammer,
  HardHat,
  X,
  Sparkles,
  Shield,
  Gift
} from 'lucide-react';

const DEPARTMENTS = [
  'Administration',
  'Secretary Office', 
  'Treasury',
  'Health Services',
  'Social Services',
  'Education & Youth',
  'Public Works',
  'Urban Planning',
  'Environmental Management',
  'Peace & Order',
  'Disaster Risk Management',
  'Traffic Management',
  'Business Permits & Licensing',
  'Market Management',
  'Tourism & Culture',
  'Information Technology',
  'Communications',
  'General'
];

const BARANGAY_JOBS = [
  'Barangay Captain', 'Barangay Secretary', 'Barangay Treasurer', 'Barangay Councilor',
  'SK Chairperson', 'SK Secretary', 'SK Treasurer', 'SK Councilor',
  'Barangay Health Worker', 'Barangay Nutrition Scholar', 'Day Care Worker',
  'Barangay Tanod', 'Traffic Enforcer', 'Environmental Officer',
  'Records Officer', 'Administrative Assistant', 'Utility Worker',
  'Project Coordinator', 'Community Organizer', 'Disaster Risk Reduction Officer'
];

const USER_ROLES = [
  {
    value: 'WORKER',
    label: 'Worker',
    description: 'Community contributor with task execution access',
    icon: HardHat,
    level: 1,
    benefits: [
      '🎯 Execute assigned community tasks',
      '📊 Track personal contribution metrics',
      '🏆 Earn achievement badges',
      '💰 Receive community rewards'
    ]
  },
  {
    value: 'BUILDER',
    label: 'Builder',
    description: 'Project creator with team coordination capabilities',
    icon: Hammer,
    level: 2,
    benefits: [
      '🏗️ Create and manage community projects',
      '👥 Coordinate worker teams',
      '📋 Design task workflows',
      '📊 Access advanced analytics'
    ]
  },
  {
    value: 'MANAGER',
    label: 'Manager',
    description: 'Strategic leader with full project oversight',
    icon: Users,
    level: 3,
    benefits: [
      '🎯 Oversee multiple projects simultaneously',
      '👨‍💼 Manage teams across departments',
      '📈 Access comprehensive reporting',
      '💼 Strategic planning capabilities'
    ]
  }
];

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const invitationCode = searchParams.get('code');
  
  const invitationData = useQuery(
    api.invitationCodes.validateInvitationCode,
    invitationCode ? { code: invitationCode } : "skip"
  );
  
  const isInvitedUser = !!invitationCode && invitationData?.valid;
  
  const syncUserToConvex = useMutation(api.users.syncUserFromClerk);
  const useInvitationCode = useMutation(api.invitationCodes.useInvitationCode);
  
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [profileDetails, setProfileDetails] = useState({
    jobTitle: '',
    department: '',
    role: '',
    agreeToTerms: false
  });
  
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    if (isInvitedUser && invitationData?.code) {
      setProfileDetails(prev => ({
        ...prev,
        department: invitationData.code.department || '',
        role: invitationData.userLevel?.name || 'WORKER',
        agreeToTerms: true,
      }));
    }
  }, [isInvitedUser, invitationData]);

  useEffect(() => {
    if (isSignedIn && user) {
      router.push('/dashboard');
    }
  }, [isSignedIn, user, router]);

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setError('');
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!basicInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!basicInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!basicInfo.email.trim()) errors.email = 'Email is required';
    if (!basicInfo.phone.trim()) errors.phone = 'Phone is required';
    if (!basicInfo.password) errors.password = 'Password is required';
    if (basicInfo.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (basicInfo.password !== basicInfo.confirmPassword) errors.confirmPassword = 'Passwords do not match';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: Record<string, string> = {};
    
    if (!profileDetails.jobTitle.trim()) errors.jobTitle = 'Job title is required';
    if (!profileDetails.department) errors.department = 'Department is required';
    if (!profileDetails.role) errors.role = 'Role is required';
    if (!profileDetails.agreeToTerms) errors.agreeToTerms = 'You must agree to the terms';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    let formatted = numbersOnly;
    if (numbersOnly.length >= 4) {
      formatted = numbersOnly.slice(0, 4) + '-' + numbersOnly.slice(4);
    }
    if (numbersOnly.length >= 7) {
      formatted = numbersOnly.slice(0, 4) + '-' + numbersOnly.slice(4, 7) + '-' + numbersOnly.slice(7, 11);
    }
    
    if (numbersOnly.length <= 11) {
      setBasicInfo(prev => ({ ...prev, phone: formatted }));
      clearFieldError('phone');
    }
  };

  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
    const capitalized = lettersOnly.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    setBasicInfo(prev => ({ ...prev, [field]: capitalized }));
    clearFieldError(field);
  };

  const clearField = (field: keyof typeof basicInfo) => {
    setBasicInfo(prev => ({ ...prev, [field]: '' }));
    clearFieldError(field);
  };

  const handleJobTitleChange = (value: string) => {
    setProfileDetails(prev => ({ ...prev, jobTitle: value }));
    clearFieldError('jobTitle');
    
    if (value.length > 0) {
      const suggestions = BARANGAY_JOBS.filter(job =>
        job.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setJobSuggestions(suggestions);
      setShowJobDropdown(suggestions.length > 0);
    } else {
      setJobSuggestions([]);
      setShowJobDropdown(false);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;
    
    if (isInvitedUser && isLoaded) {
      setIsLoading(true);
      setError('');
      
      try {
        const result = await signUp.create({
          emailAddress: basicInfo.email,
          password: basicInfo.password,
          firstName: basicInfo.firstName,
          lastName: basicInfo.lastName,
          unsafeMetadata: {
            phone: basicInfo.phone,
            jobTitle: 'Team Member',
            department: profileDetails.department,
            role: profileDetails.role,
            invitationCode: invitationCode,
            profileCompleted: true,
            registrationStep: 2
          }
        });

        if (result.status === "missing_requirements") {
          await signUp.prepareEmailAddressVerification({ 
            strategy: "email_code" 
          });
          setStep(2);
        } else if (result.status === "complete") {
          await handleRegistrationComplete();
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invited user registration error:', err);
        }
        setError(err.errors?.[0]?.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      setStep(2);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2() || !isLoaded) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      
      const result = await signUp.create({
        emailAddress: basicInfo.email,
        password: basicInfo.password,
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        unsafeMetadata: {
          phone: basicInfo.phone,
          jobTitle: profileDetails.jobTitle,
          department: profileDetails.department,
          role: profileDetails.role,
          profileCompleted: true,
          registrationStep: 2
        }
      });

      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ 
          strategy: "email_code" 
        });
        setStep(3);
      } else if (result.status === "complete") {
        await handleRegistrationComplete();
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration Step 2 error:', err);
      }
      setError(err.errors?.[0]?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !verificationCode || !signUp) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await handleRegistrationComplete();
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Verification error:', err);
      }
      setError(err.errors?.[0]?.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationComplete = async () => {
    try {
      if (signUp?.createdSessionId && setActive) {
        await setActive({ session: signUp.createdSessionId });
      }

      try {
        await syncUserToConvex({
          clerkId: signUp!.createdUserId!,
          email: basicInfo.email,
          firstName: basicInfo.firstName,
          lastName: basicInfo.lastName,
          phone: basicInfo.phone,
          jobTitle: profileDetails.jobTitle,
          department: profileDetails.department,
          role: profileDetails.role,
        });

      } catch (convexError) {}

      setShowSuccessMessage(true);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Registration completion error:', err);
      }
      setError('Registration completed! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <style jsx>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(-1px, -1px); }
          60% { transform: translate(1px, 1px); }
          80% { transform: translate(1px, -1px); }
          100% { transform: translate(0); }
        }
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          animation: glitch-1 0.5s infinite;
          color: #ef4444;
          z-index: -1;
        }
        .glitch-text::after {
          animation: glitch-2 0.5s infinite;
          color: #3b82f6;
          z-index: -2;
        }
        @keyframes glitch-1 {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes glitch-2 {
          0% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(-2px, 2px); }
          100% { transform: translate(0); }
        }
      `}</style>
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              🎉 Welcome to BarangayLink!
            </h2>
            <p className="text-green-100 text-lg mb-6">
              Your account has been created successfully. You are now a {profileDetails.role} in {profileDetails.department}.
            </p>
            <div className="flex items-center justify-center space-x-2 text-green-200">
              <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-green-200 text-sm mt-4">Redirecting to dashboard...</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full">
        {/* Back to Home */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Header - Different for invited users */}
          {isInvitedUser ? (
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                🎉 You're Invited!
              </h1>
              <p className="text-gray-400 mb-4">
                Welcome to BarangayLink! Complete your quick registration
              </p>
              
              {/* Invitation Details Card */}
              <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300 font-semibold">Your Invitation</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <span className="ml-2 text-white font-medium capitalize">
                      {invitationData?.userLevel?.name?.toLowerCase() || 'Member'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <span className="ml-2 text-white font-medium">
                      {invitationData?.code?.department || 'General'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
                  <Shield className="w-4 h-4" />
                  <span>Pre-approved access • Skip profile setup</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Join BarangayLink
              </h1>
              <p className="text-gray-400">
                Create your account to access community services
              </p>
            </div>
          )}

          {/* Invalid Invitation Code Warning */}
          {invitationCode && !isInvitedUser && invitationData && (
            <div className="mb-6 bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <div>
                <p className="text-yellow-300 text-sm font-medium">Invalid Invitation Code</p>
                <p className="text-yellow-400/70 text-xs">{invitationData?.message || 'This code is not valid. You can still register normally.'}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Step Indicator - Simplified for invited users */}
          {isInvitedUser ? (
            <>
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <div className={`w-24 h-1 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-600'}`}></div>
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="flex justify-around text-xs text-gray-400 mb-8 -mt-4">
                <span className={step === 1 ? 'text-purple-400 font-medium' : ''}>Your Details</span>
                <span className={step === 2 ? 'text-purple-400 font-medium' : ''}>Verify Email</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    1
                  </div>
                  <div className={`w-16 h-1 ${step >= 2 ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    2
                  </div>
                  <div className={`w-16 h-1 ${step >= 3 ? 'bg-green-600' : 'bg-gray-600'}`}></div>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-400'}`}>
                    3
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-8 -mt-4">
                <span>Basic Info</span>
                <span>Profile Details</span>
                <span>Verification</span>
              </div>
            </>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="animate-in fade-in duration-500">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Basic Information</h3>
                <p className="text-gray-400">Let's start with your basic details</p>
              </div>

              <form onSubmit={handleStep1Submit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={basicInfo.firstName}
                        onChange={(e) => handleNameChange('firstName', e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                          fieldErrors.firstName ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter your first name"
                        required
                      />
                      {basicInfo.firstName && (
                        <button
                          type="button"
                          onClick={() => setBasicInfo(prev => ({ ...prev, firstName: '' }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-sm text-red-400">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={basicInfo.lastName}
                        onChange={(e) => handleNameChange('lastName', e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                          fieldErrors.lastName ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter your last name"
                        required
                      />
                      {basicInfo.lastName && (
                        <button
                          type="button"
                          onClick={() => setBasicInfo(prev => ({ ...prev, lastName: '' }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-sm text-red-400">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={basicInfo.email}
                      onChange={(e) => {
                        setBasicInfo(prev => ({ ...prev, email: e.target.value }));
                        clearFieldError('email');
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                        fieldErrors.email ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="juan@gmail.com"
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={basicInfo.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                        fieldErrors.phone ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="0925-643-3456"
                      required
                    />
                    {basicInfo.phone && (
                      <button
                        type="button"
                        onClick={() => setBasicInfo(prev => ({ ...prev, phone: '' }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-400">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={basicInfo.password}
                        onChange={(e) => {
                          setBasicInfo(prev => ({ ...prev, password: e.target.value }));
                          clearFieldError('password');
                        }}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                          fieldErrors.password ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Create a strong password"
                        required
                        minLength={8}
                      />
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-sm text-red-400">{fieldErrors.password}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={basicInfo.confirmPassword}
                        onChange={(e) => {
                          setBasicInfo(prev => ({ ...prev, confirmPassword: e.target.value }));
                          clearFieldError('confirmPassword');
                        }}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                          fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                    {fieldErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full px-6 py-3 ${isInvitedUser ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-600'} text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : isInvitedUser ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Continue to Verification
                    </>
                  ) : (
                    'Continue to Profile Details'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: For invited users = Verification, For regular users = Profile Details */}
          {step === 2 && isInvitedUser && (
            <div className="animate-in slide-in-from-right-5 duration-500">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Verify Your Email</h3>
                <p className="text-gray-400">We sent a verification code to <span className="text-purple-400 font-medium">{basicInfo.email}</span></p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-6">
                {/* Verification Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code *
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">Enter the 6-digit code from your email</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Complete Registration
                    </>
                  )}
                </button>
              </form>

              {/* Resend Code */}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                      setError('');
                      alert('New code sent!');
                    } catch (err) {
                      setError('Failed to resend code');
                    }
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm underline"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Profile Details (Regular users only) */}
          {step === 2 && !isInvitedUser && (
            <div className="animate-in slide-in-from-right-5 duration-500">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Profile Details</h3>
                <p className="text-gray-400">Tell us about your role in the barangay</p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Job Title *
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileDetails.jobTitle}
                      onChange={(e) => handleJobTitleChange(e.target.value)}
                      onFocus={() => {
                          if (profileDetails.jobTitle) {
                          handleJobTitleChange(profileDetails.jobTitle);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowJobDropdown(false), 200);
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                        fieldErrors.jobTitle ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Type your job title (e.g., Barangay Captain)..."
                      required
                      autoComplete="off"
                    />
                    
                    {/* Job Suggestions - Autocomplete Dropdown */}
                    {showJobDropdown && jobSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-green-500/30 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                        <div className="px-3 py-2 bg-gray-700/50 border-b border-gray-600">
                          <p className="text-xs text-gray-400">💡 Select a suggested position or continue typing</p>
                        </div>
                        {jobSuggestions.map((job, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setProfileDetails(prev => ({ ...prev, jobTitle: job }));
                              setShowJobDropdown(false);
                              clearFieldError('jobTitle');
                            }}
                            className="w-full text-left px-4 py-3 text-white hover:bg-green-600/20 hover:border-l-2 hover:border-green-500 transition-all flex items-center gap-2"
                          >
                            <Briefcase className="w-4 h-4 text-green-400" />
                            <span>{job}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {fieldErrors.jobTitle && (
                    <p className="mt-1 text-sm text-red-400">{fieldErrors.jobTitle}</p>
                  )}
                </div>

                {/* Department Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={profileDetails.department}
                      onChange={(e) => {
                        setProfileDetails(prev => ({ ...prev, department: e.target.value }));
                        clearFieldError('department');
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white ${
                        fieldErrors.department ? 'border-red-500' : 'border-gray-600'
                      }`}
                      required
                    >
                      <option value="">Select your department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept} className="bg-gray-700 text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  {fieldErrors.department && (
                    <p className="mt-1 text-sm text-red-400">{fieldErrors.department}</p>
                  )}
                  {profileDetails.department && (
                    <p className="mt-1 text-sm text-green-400">✓ You will be assigned to: {profileDetails.department}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Access Role *
                  </label>
                  <div className="space-y-4">
                    {USER_ROLES.map((role) => {
                      const IconComponent = role.icon;
                      return (
                        <div key={role.value}>
                          <label
                            className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                              profileDetails.role === role.value
                                ? 'border-green-500 bg-green-900/20'
                                : fieldErrors.role
                                ? 'border-red-500 bg-red-900/10'
                                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                            }`}
                          >
                            <input
                              type="radio"
                              name="role"
                              value={role.value}
                              checked={profileDetails.role === role.value}
                              onChange={(e) => {
                                setProfileDetails(prev => ({ ...prev, role: e.target.value }));
                                clearFieldError('role');
                              }}
                              className="sr-only"
                            />
                            <div className="flex w-full">
                              <div className="flex-shrink-0">
                                <IconComponent className={`h-6 w-6 ${
                                  profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                                }`} />
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-lg font-semibold ${
                                    profileDetails.role === role.value ? 'text-green-300' : 'text-gray-300'
                                  }`}>
                                    {role.label} (Level {role.level})
                                  </span>
                                  <div className={`w-4 h-4 rounded-full border-2 ${
                                    profileDetails.role === role.value
                                      ? 'border-green-500 bg-green-500'
                                      : 'border-gray-400'
                                  }`}>
                                    {profileDetails.role === role.value && (
                                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                    )}
                                  </div>
                                </div>
                                <p className={`text-sm mb-3 ${
                                  profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                                }`}>
                                  {role.description}
                                </p>
                                
                                {/* Benefits */}
                                <div>
                                  <h5 className={`text-xs font-medium mb-2 ${
                                    profileDetails.role === role.value ? 'text-green-300' : 'text-gray-300'
                                  }`}>
                                    What you can do:
                                  </h5>
                                  <ul className="space-y-1">
                                    {role.benefits.map((benefit, index) => (
                                      <li key={index} className={`text-xs ${
                                        profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                                      }`}>
                                        {benefit}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {fieldErrors.role && (
                    <p className="mt-2 text-sm text-red-400">{fieldErrors.role}</p>
                  )}
                  {profileDetails.role && (
                    <p className="mt-3 text-sm font-medium text-green-400 bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-2">
                      ✓ Your assigned role: <span className="font-bold">{USER_ROLES.find(r => r.value === profileDetails.role)?.label || profileDetails.role}</span> (Level {USER_ROLES.find(r => r.value === profileDetails.role)?.level || 1})
                    </p>
                  )}
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start">
                  <input 
                    type="checkbox" 
                    id="agreeToTerms"
                    checked={profileDetails.agreeToTerms}
                    onChange={(e) => {
                      setProfileDetails(prev => ({ ...prev, agreeToTerms: e.target.checked }));
                      clearFieldError('agreeToTerms');
                    }}
                    className={`mt-1 rounded border text-green-600 focus:ring-green-500 bg-gray-700 ${
                      fieldErrors.agreeToTerms ? 'border-red-500' : 'border-gray-600'
                    }`}
                    required
                  />
                  <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-400">
                    I agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-green-400 hover:text-green-300 transition-colors underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" target="_blank" className="text-green-400 hover:text-green-300 transition-colors underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {fieldErrors.agreeToTerms && (
                  <p className="text-sm text-red-400">{fieldErrors.agreeToTerms}</p>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !isLoaded}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Continue to Verification
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Email Verification */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-5 duration-500">
              <div className="text-center">
                <Mail className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Verify Your Email</h3>
                <p className="text-gray-400 mb-6">
                  We've sent a 6-digit verification code to <strong>{basicInfo.email}</strong>
                </p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) {
                        setVerificationCode(value);
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 text-center text-2xl tracking-[0.5em] font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="mt-2 text-xs text-gray-400 text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Complete Registration
                </button>
              </form>

              <div className="text-center space-y-2">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                >
                  ← Back to profile details
                </button>
                <p className="text-xs text-gray-500">
                  Didn't receive the code? Check your spam folder.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* CAPTCHA Widget - Always available for Clerk */}
      <div id="clerk-captcha" className="hidden"></div>
    </div>
  );
}