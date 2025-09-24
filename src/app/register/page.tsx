"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSignUp, useSignIn, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  Briefcase,
  Shield,
  CheckCircle,
  ChevronDown,
  Camera,
  Upload,
  Users,
  Hammer,
  HardHat,
  Mail,
  Phone,
  User,
  Lock
} from 'lucide-react';

// Barangay job titles with predictions
const BARANGAY_JOBS = [
  'Barangay Captain', 
  'Barangay Secretary', 
  'Barangay Treasurer', 
  'Barangay Councilor',
  'SK Chairperson', 
  'SK Secretary', 
  'SK Treasurer', 
  'SK Councilor',
  'Barangay Health Worker', 
  'Barangay Nutrition Scholar', 
  'Day Care Worker',
  'Barangay Tanod', 
  'Traffic Enforcer', 
  'Environmental Officer',
  'Records Officer', 
  'Administrative Assistant', 
  'Utility Worker',
  'Project Coordinator', 
  'Community Organizer', 
  'Social Worker',
  'Disaster Risk Reduction Officer', 
  'Peace and Order Officer', 
  'Youth Development Officer',
  'Senior Citizen Affairs Officer', 
  'Women and Children Protection Officer'
];

export default function RegisterPage() {
  const { signUp, isLoaded, setActive } = useSignUp();
  const { signIn } = useSignIn();
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  
  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  // Step 3: Profile Details
  const [profileDetails, setProfileDetails] = useState({
    jobTitle: '',
    role: '',
    agreeToTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [verificationCode, setVerificationCode] = useState('');
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  
  // Job title dropdown state
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [jobSuggestions, setJobSuggestions] = useState<string[]>([]);

  // Redirect if user is already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.push('/dashboard');
    }
  }, [isSignedIn, user, router]);

  // Available roles based on hierarchy
  const availableRoles = [
    {
      value: 'WORKER',
      label: 'Worker',
      description: 'Basic access to view projects and tasks',
      icon: HardHat,
      level: 1
    },
    {
      value: 'BUILDER',
      label: 'Builder',
      description: 'Can create and manage tasks',
      icon: Hammer,
      level: 2
    },
    {
      value: 'MANAGER',
      label: 'Manager',
      description: 'Can manage projects and team members',
      icon: Users,
      level: 3
    },
    {
      value: 'ADMIN',
      label: 'Admin',
      description: 'Full system access and user management',
      icon: Shield,
      level: 4
    }
  ];

  // Auto-capitalize names
  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const capitalized = value.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    setBasicInfo(prev => ({ ...prev, [field]: capitalized }));
    clearFieldError(field);
  };

  // Phone number validation (11 digits only)
  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    if (numbersOnly.length <= 11) {
      setBasicInfo(prev => ({ ...prev, phone: numbersOnly }));
      clearFieldError('phone');
    }
  };

  // Profile picture handling
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Job title with suggestions
  const handleJobTitleChange = (value: string) => {
    setProfileDetails(prev => ({ ...prev, jobTitle: value }));
    clearFieldError('jobTitle');
    
    if (value.length > 0) {
      const suggestions = BARANGAY_JOBS.filter(job =>
        job.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setJobSuggestions(suggestions);
      setShowJobDropdown(suggestions.length > 0);
    } else {
      setShowJobDropdown(false);
    }
  };

  const clearFieldError = (field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    setError('');
  };


  const validateField = (field: string, value: any, currentStep: number = step): string => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        return !value || !value.trim() ? `${field === 'firstName' ? 'First' : 'Last'} name is required` : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !value ? 'Email is required' : !emailRegex.test(value) ? 'Please enter a valid email' : '';
      case 'phone':
        return !value ? 'Phone number is required' : value.length !== 11 ? 'Please enter 11 digits (e.g., 09123456789)' : '';
      case 'password':
        return !value ? 'Password is required' : value.length < 6 ? 'Password must be at least 6 characters' : '';
      case 'confirmPassword':
        return !value ? 'Please confirm your password' : value !== basicInfo.password ? 'Passwords do not match' : '';
      case 'jobTitle':
        return !value || !value.trim() ? 'Job title is required' : '';
      case 'role':
        return !value ? 'Please select a role' : '';
      case 'agreeToTerms':
        return !value ? 'You must agree to the Terms of Service' : '';
      default:
        return '';
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    Object.keys(basicInfo).forEach(key => {
      const error = validateField(key, basicInfo[key as keyof typeof basicInfo], 1);
      if (error) errors[key] = error;
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: Record<string, string> = {};
    
    if (!profileDetails.jobTitle.trim()) {
      errors.jobTitle = 'Job title is required';
    }
    
    if (!profileDetails.role) {
      errors.role = 'Please select a role';
    }
    
    if (!profileDetails.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Basic Info Submission
  const handleStep1Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Check if user is already signed in
    if (isSignedIn) {
      setError('You are already signed in. Redirecting to dashboard...');
      router.push('/dashboard');
      return;
    }
    
    if (!validateStep1()) return;
    if (!isLoaded) return;
    
    setIsLoading(true);
    
    try {
      // Create user with minimal required fields first
      const result = await signUp.create({
        emailAddress: basicInfo.email,
        password: basicInfo.password,
        unsafeMetadata: {
          firstName: basicInfo.firstName,
          lastName: basicInfo.lastName,
          phone: basicInfo.phone,
          registrationDate: new Date().toISOString(),
          step: 1
        }
      });

      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setStep(2);
      } else if (result.status === "complete") {
        setStep(3);
      }
    } catch (err: any) {
      console.error('Step 1 Registration error:', err);
      if (err.errors && err.errors[0]) {
        const errorMessage = err.errors[0].message;
        if (errorMessage.includes('captcha') || errorMessage.includes('bot')) {
          setError('Please complete the security verification. If you continue to see this message, try refreshing the page.');
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Profile Details Submission
  const handleStep3Submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!validateStep3()) return;
    if (!isLoaded || !signUp) return;
    
    setIsLoading(true);
    
    try {
      // Update user metadata with profile details
      await signUp.update({
        unsafeMetadata: {
          ...signUp.unsafeMetadata,
          jobTitle: profileDetails.jobTitle,
          role: profileDetails.role,
          profileCompleted: true,
          profileCompletedAt: new Date().toISOString()
        }
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.errors && err.errors[0]) {
        setError(err.errors[0].message);
      } else {
        setError('Profile update failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Social Sign-up handlers
  const handleSocialSignUp = async (provider: 'oauth_google' | 'oauth_facebook' | 'oauth_tiktok') => {
    if (!isLoaded) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/register?step=3'
      });
    } catch (err: any) {
      console.error('Social sign-up error:', err);
      setError('Social sign-up failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded || !verificationCode || !signUp) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        setStep(3); // Move to profile details step
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      if (err.errors && err.errors[0]) {
        setError(err.errors[0].message);
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check URL params for social sign-up completion
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam === '3') {
      setStep(3);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
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
          {/* Header */}
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

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Step Indicator */}
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

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Basic Information</h3>
                <p className="text-gray-400">Let's start with your basic details</p>
              </div>

              {/* Social Sign-up Options */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('oauth_google')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors border border-gray-300 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('oauth_facebook')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-lg hover:bg-[#166FE5] transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSocialSignUp('oauth_tiktok')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  Continue with TikTok
                </button>
              </div>

              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="px-3 text-sm text-gray-400">Or sign up with email</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>

            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Personal Information */}
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
                    className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.firstName ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Juan"
                    required
                  />
                </div>
                {fieldErrors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={basicInfo.lastName}
                  onChange={(e) => handleNameChange('lastName', e.target.value)}
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                    fieldErrors.lastName ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="Dela Cruz"
                  required
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

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
                  placeholder="juan@example.com"
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number * (11 digits)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={basicInfo.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.phone ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="09123456789"
                    maxLength={11}
                    required
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.phone}</p>
                )}
              </div>
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
                        const suggestions = BARANGAY_JOBS.filter(job =>
                          job.toLowerCase().includes(profileDetails.jobTitle.toLowerCase())
                        ).slice(0, 5);
                        setJobSuggestions(suggestions);
                        setShowJobDropdown(true);
                      }
                    }}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.jobTitle ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Start typing..."
                    required
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  
                  {/* Job Suggestions Dropdown */}
                  {showJobDropdown && jobSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {jobSuggestions.map((job, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setProfileDetails(prev => ({ ...prev, jobTitle: job }));
                            setShowJobDropdown(false);
                            clearFieldError('jobTitle');
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                        >
                          {job}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {fieldErrors.jobTitle && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.jobTitle}</p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Access Role *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableRoles.map((role) => {
                  const IconComponent = role.icon;
                  return (
                    <label
                      key={role.value}
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
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <IconComponent className={`h-6 w-6 ${
                            profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="ml-3">
                          <span className={`block text-sm font-medium ${
                            profileDetails.role === role.value ? 'text-green-300' : 'text-gray-300'
                          }`}>
                            {role.label} (Level {role.level})
                          </span>
                          <span className={`block text-xs ${
                            profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                          }`}>
                            {role.description}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {fieldErrors.role && (
                <p className="mt-2 text-sm text-red-400">{fieldErrors.role}</p>
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
                    type={showPassword ? "text" : "password"}
                    value={basicInfo.password}
                    onChange={(e) => {
                      setBasicInfo(prev => ({ ...prev, password: e.target.value }));
                      clearFieldError('password');
                      // Also clear confirm password error if they match now
                      if (basicInfo.confirmPassword && e.target.value === basicInfo.confirmPassword) {
                        clearFieldError('confirmPassword');
                      }
                    }}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.password ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Create a strong password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
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
                    type={showConfirmPassword ? "text" : "password"}
                    value={basicInfo.confirmPassword}
                    onChange={(e) => {
                      setBasicInfo(prev => ({ ...prev, confirmPassword: e.target.value }));
                      clearFieldError('confirmPassword');
                    }}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-500' 
                        : basicInfo.confirmPassword && basicInfo.password === basicInfo.confirmPassword
                        ? 'border-green-500 focus:ring-green-500'
                        : 'border-gray-600 focus:ring-green-500'
                    }`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
                )}
                {basicInfo.confirmPassword && basicInfo.password === basicInfo.confirmPassword && !fieldErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-green-400">Passwords match!</p>
                )}
              </div>
            </div>

            {/* Remove terms agreement from Step 1 - will be in Step 3 */}

            {/* CAPTCHA Widget */}
            <div id="clerk-captcha" className="flex justify-center"></div>

              <button
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue to Verification
              </button>
            </form>
            </>
          )}

          {/* Step 2: Email Verification */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Mail className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Verify Your Email</h3>
                <p className="text-gray-400 mb-6">
                  We've sent a 6-digit verification code to <strong>{basicInfo.email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerification} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only allow digits
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
                  Verify & Continue
                </button>
              </form>

              <div className="text-center space-y-2">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
                >
                  ← Back to basic info
                </button>
                <p className="text-xs text-gray-500">
                  Didn't receive the code? Check your spam folder or try again in a few minutes.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Profile Details */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Complete Your Profile</h3>
                <p className="text-gray-400">Tell us about your role in the barangay</p>
              </div>

              <form onSubmit={handleStep3Submit} className="space-y-6">
                {/* Profile Picture */}
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Profile Picture (Optional)
                  </label>
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 mb-4">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-full h-full rounded-full object-cover border-4 border-gray-600"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <label
                        htmlFor="profilePicture"
                        className="absolute bottom-0 right-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors"
                      >
                        <Upload className="w-5 h-5 text-white" />
                      </label>
                      <input
                        type="file"
                        id="profilePicture"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-gray-400">Click the camera icon to upload a photo</p>
                  </div>
                </div>

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
                          const suggestions = BARANGAY_JOBS.filter(job =>
                            job.toLowerCase().includes(profileDetails.jobTitle.toLowerCase())
                          ).slice(0, 5);
                          setJobSuggestions(suggestions);
                          setShowJobDropdown(true);
                        }
                      }}
                      className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                        fieldErrors.jobTitle ? 'border-red-500' : 'border-gray-600'
                      }`}
                      placeholder="Start typing your job title..."
                      required
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    
                    {/* Job Suggestions Dropdown */}
                    {showJobDropdown && jobSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {jobSuggestions.map((job, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setProfileDetails(prev => ({ ...prev, jobTitle: job }));
                              setShowJobDropdown(false);
                              clearFieldError('jobTitle');
                            }}
                            className="w-full text-left px-4 py-2 text-white hover:bg-gray-600 transition-colors"
                          >
                            {job}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {fieldErrors.jobTitle && (
                    <p className="mt-1 text-sm text-red-400">{fieldErrors.jobTitle}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Access Role *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {availableRoles.map((role) => {
                      const IconComponent = role.icon;
                      return (
                        <label
                          key={role.value}
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
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <IconComponent className={`h-6 w-6 ${
                                profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                              }`} />
                            </div>
                            <div className="ml-3">
                              <span className={`block text-sm font-medium ${
                                profileDetails.role === role.value ? 'text-green-300' : 'text-gray-300'
                              }`}>
                                {role.label} (Level {role.level})
                              </span>
                              <span className={`block text-xs ${
                                profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                              }`}>
                                {role.description}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {fieldErrors.role && (
                    <p className="mt-2 text-sm text-red-400">{fieldErrors.role}</p>
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
                    <Link href="/terms" className="text-green-400 hover:text-green-300 transition-colors">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-green-400 hover:text-green-300 transition-colors">
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
                    onClick={() => setStep(2)}
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
                    Complete Registration
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Divider - Only show on step 1 */}
          {step === 1 && (
            <>
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="px-3 text-sm text-gray-400">Or</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Already have an account?{' '}
                  <Link href="/login" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Information Notice - Only show on step 1 */}
        {step === 1 && (
          <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> Registration requires verification by barangay officials. 
              You will receive an email confirmation once your account is approved.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
