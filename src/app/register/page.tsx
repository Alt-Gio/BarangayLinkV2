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
  const { signUp, isLoaded } = useSignUp();
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
    department: '',
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
  
  // Glitch animation state for job title
  const [isGlitching, setIsGlitching] = useState(true);
  const [glitchText, setGlitchText] = useState('');
  const [jobTitleFocused, setJobTitleFocused] = useState(false);
  
  // Glitch animation for name fields
  const [firstNameGlitching, setFirstNameGlitching] = useState(true);
  const [lastNameGlitching, setLastNameGlitching] = useState(true);
  const [firstNameGlitchText, setFirstNameGlitchText] = useState('');
  const [lastNameGlitchText, setLastNameGlitchText] = useState('');
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  
  // Email domain suggestions
  const [emailDomainSuggestions, setEmailDomainSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  
  // Registration success state
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Redirect if user is already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.push('/dashboard');
    }
  }, [isSignedIn, user, router]);

  // Glitch animation effect for job title
  useEffect(() => {
    if (!isGlitching || jobTitleFocused || profileDetails.jobTitle) return;

    const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    const targetJobs = [
      'Barangay Captain',
      'Secretary',
      'Treasurer', 
      'Health Worker',
      'Tanod',
      'Councilor',
      'SK Chairman',
      'Social Worker',
      'Engineer',
      'Teacher'
    ];

    let currentJobIndex = 0;
    let currentJob = targetJobs[currentJobIndex];
    let revealedChars = 0;

    const interval = setInterval(() => {
      if (revealedChars < currentJob.length) {
        // Reveal one more character and glitch the rest
        const revealed = currentJob.slice(0, revealedChars + 1);
        const remaining = currentJob.length - (revealedChars + 1);
        const glitched = Array.from({ length: remaining }, () => 
          glitchChars[Math.floor(Math.random() * glitchChars.length)]
        ).join('');
        
        setGlitchText(revealed + glitched);
        revealedChars++;
      } else {
        // Show complete job for a moment, then switch to next
        setGlitchText(currentJob);
        setTimeout(() => {
          currentJobIndex = (currentJobIndex + 1) % targetJobs.length;
          currentJob = targetJobs[currentJobIndex];
          revealedChars = 0;
        }, 1000);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isGlitching, jobTitleFocused, profileDetails.jobTitle]);

  // Glitch animation for first name
  useEffect(() => {
    if (!firstNameGlitching || firstNameFocused || basicInfo.firstName) return;

    const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const targetNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Carlos', 'Rosa', 'Miguel', 'Elena', 'Pedro', 'Sofia'];
    
    let currentNameIndex = 0;
    let currentName = targetNames[currentNameIndex];
    let revealedChars = 0;

    const interval = setInterval(() => {
      if (revealedChars < currentName.length) {
        const revealed = currentName.slice(0, revealedChars + 1);
        const remaining = currentName.length - (revealedChars + 1);
        const glitched = Array.from({ length: remaining }, () => 
          glitchChars[Math.floor(Math.random() * glitchChars.length)]
        ).join('');
        
        setFirstNameGlitchText(revealed + glitched);
        revealedChars++;
      } else {
        setFirstNameGlitchText(currentName);
        setTimeout(() => {
          currentNameIndex = (currentNameIndex + 1) % targetNames.length;
          currentName = targetNames[currentNameIndex];
          revealedChars = 0;
        }, 1200);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [firstNameGlitching, firstNameFocused, basicInfo.firstName]);

  // Glitch animation for last name
  useEffect(() => {
    if (!lastNameGlitching || lastNameFocused || basicInfo.lastName) return;

    const glitchChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const targetSurnames = ['Dela Cruz', 'Santos', 'Reyes', 'Garcia', 'Gonzales', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Hernandez'];
    
    let currentSurnameIndex = 0;
    let currentSurname = targetSurnames[currentSurnameIndex];
    let revealedChars = 0;

    const interval = setInterval(() => {
      if (revealedChars < currentSurname.length) {
        const revealed = currentSurname.slice(0, revealedChars + 1);
        const remaining = currentSurname.length - (revealedChars + 1);
        const glitched = Array.from({ length: remaining }, () => 
          glitchChars[Math.floor(Math.random() * glitchChars.length)]
        ).join('');
        
        setLastNameGlitchText(revealed + glitched);
        revealedChars++;
      } else {
        setLastNameGlitchText(currentSurname);
        setTimeout(() => {
          currentSurnameIndex = (currentSurnameIndex + 1) % targetSurnames.length;
          currentSurname = targetSurnames[currentSurnameIndex];
          revealedChars = 0;
        }, 1200);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [lastNameGlitching, lastNameFocused, basicInfo.lastName]);

  // Available departments - flattened for dropdown
  const availableDepartments = [
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

  // Available roles with life improvements
  const availableRoles = [
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
        '💰 Receive community rewards',
        '📈 Build professional portfolio'
      ],
      lifeImprovements: [
        'Develop practical skills through real projects',
        'Build network within barangay community',
        'Gain recognition for community service',
        'Access to training and development programs'
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
        '📊 Access advanced analytics',
        '🎖️ Leadership recognition badges'
      ],
      lifeImprovements: [
        'Develop leadership and project management skills',
        'Drive meaningful change in your community',
        'Mentor and guide fellow community members',
        'Build reputation as a community leader'
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
        '💼 Strategic planning capabilities',
        '🏅 Executive achievement system'
      ],
      lifeImprovements: [
        'Master advanced management and strategy skills',
        'Shape the future of your barangay',
        'Build extensive professional network',
        'Gain experience in public administration'
      ]
    }
  ];

  // Auto-capitalize names (letters only)
  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    // Only allow letters and spaces
    const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
    const capitalized = lettersOnly.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    setBasicInfo(prev => ({ ...prev, [field]: capitalized }));
    clearFieldError(field);
  };

  // Phone number validation with dash formatting (0925-643-3456)
  const handlePhoneChange = (value: string) => {
    // Remove all non-digits
    const numbersOnly = value.replace(/\D/g, '');
    
    // Format as 0925-643-3456 (13 characters total)
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

  // Email domain suggestions
  const handleEmailChange = (value: string) => {
    setBasicInfo(prev => ({ ...prev, email: value }));
    clearFieldError('email');
    
    // Check if user is typing after @
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1 && atIndex < value.length - 1) {
      const domain = value.slice(atIndex + 1).toLowerCase();
      const popularDomains = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
        'icloud.com', 'protonmail.com', 'aol.com', 'live.com'
      ];
      
      const suggestions = popularDomains
        .filter(d => d.startsWith(domain))
        .map(d => value.slice(0, atIndex + 1) + d);
      
      setEmailDomainSuggestions(suggestions);
      setShowEmailSuggestions(suggestions.length > 0 && domain.length > 0);
    } else {
      setShowEmailSuggestions(false);
    }
  };

  // Clear field function
  const clearField = (field: keyof typeof basicInfo) => {
    setBasicInfo(prev => ({ ...prev, [field]: '' }));
    clearFieldError(field);
    
    // Restart glitch animations for name fields
    if (field === 'firstName') {
      setFirstNameGlitching(true);
    } else if (field === 'lastName') {
      setLastNameGlitching(true);
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

  const validateField = (field: string, value: string | boolean, currentStep: number = step): string => {
    switch (field) {
      case 'firstName':
      case 'lastName':
        if (typeof value !== 'string' || !value || !value.trim()) {
          return `${field === 'firstName' ? 'First' : 'Last'} name is required`;
        }
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return `${field === 'firstName' ? 'First' : 'Last'} name must contain only letters`;
        }
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (typeof value !== 'string' || !value.includes('@')) return 'Email must contain @ symbol';
        return '';
      case 'phone':
        if (typeof value !== 'string' || !value) return 'Phone number is required';
        const phoneNumbers = value.replace(/\D/g, '');
        if (phoneNumbers.length !== 11) return 'Phone must be 11 digits (format: 0925-643-3456)';
        if (!phoneNumbers.startsWith('09')) return 'Phone must start with 09';
        return '';
      case 'password':
        if (typeof value !== 'string' || !value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
      case 'confirmPassword':
        if (typeof value !== 'string' || !value) return 'Please confirm your password';
        if (value !== basicInfo.password) return 'Passwords do not match';
        return '';
      case 'jobTitle':
        return (typeof value !== 'string' || !value || !value.trim()) ? 'Job title is required' : '';
      case 'department':
        return (typeof value !== 'string' || !value) ? 'Please select a department' : '';
      case 'role':
        return (typeof value !== 'string' || !value) ? 'Please select an access role' : '';
      case 'agreeToTerms':
        return (typeof value !== 'boolean' || !value) ? 'You must agree to the Terms of Service and Privacy Policy' : '';
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
    
    if (!profileDetails.department) {
      errors.department = 'Please select a department';
    }
    
    if (!profileDetails.role) {
      errors.role = 'Please select an access role';
    }
    
    if (!profileDetails.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the Terms of Service and Privacy Policy';
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
    } catch (err: unknown) {
      console.error('Step 1 Registration error:', err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors[0]) {
        const errorMessage = (err as any).errors[0].message;
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
        firstName: basicInfo.firstName,
        lastName: basicInfo.lastName,
        unsafeMetadata: {
          ...signUp.unsafeMetadata,
          jobTitle: profileDetails.jobTitle,
          department: profileDetails.department,
          role: profileDetails.role,
          phone: basicInfo.phone,
          profileCompleted: true,
          profileCompletedAt: new Date().toISOString()
        }
      });
      
      // Show success message first
      setShowSuccessMessage(true);
      
      // Redirect to dashboard after showing success message (reduced to 1.5 seconds)
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: unknown) {
      console.error('Profile update error:', err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors[0]) {
        setError((err as any).errors[0].message);
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      console.error('Verification error:', err);
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors[0]) {
        setError((err as any).errors[0].message);
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
      {/* Success Message Modal */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-3xl p-8 max-w-md w-full text-center transform animate-bounce">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              🎉 Welcome to BarangayLink!
            </h2>
            <p className="text-green-100 text-lg mb-6">
              We help improve your barangay's productivity and bring the community together.
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
            <div className="animate-in fade-in duration-500">
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
                  
                  {/* First Name Glitch Animation */}
                  {firstNameGlitching && !firstNameFocused && !basicInfo.firstName && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-blue-400 font-mono text-sm">
                        <span 
                          className="glitch-text"
                          style={{
                            textShadow: '0 0 5px rgba(59, 130, 246, 0.5)',
                            animation: 'glitch 0.3s infinite'
                          }}
                        >
                          {firstNameGlitchText}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={basicInfo.firstName}
                    onChange={(e) => {
                      handleNameChange('firstName', e.target.value);
                      if (e.target.value) {
                        setFirstNameGlitching(false);
                      }
                    }}
                    onFocus={() => {
                      setFirstNameFocused(true);
                      setFirstNameGlitching(false);
                    }}
                    onBlur={() => {
                      setFirstNameFocused(false);
                      if (!basicInfo.firstName) {
                        setFirstNameGlitching(true);
                      }
                    }}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.firstName ? 'border-red-500' : 'border-gray-600'
                    } ${!basicInfo.firstName && firstNameGlitching ? 'text-transparent' : ''}`}
                    placeholder={firstNameGlitching ? '' : 'Enter your first name'}
                    required
                  />
                  
                  {/* Clear Button */}
                  {basicInfo.firstName && (
                    <button
                      type="button"
                      onClick={() => clearField('firstName')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
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
                  
                  {/* Last Name Glitch Animation */}
                  {lastNameGlitching && !lastNameFocused && !basicInfo.lastName && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-purple-400 font-mono text-sm">
                        <span 
                          className="glitch-text"
                          style={{
                            textShadow: '0 0 5px rgba(168, 85, 247, 0.5)',
                            animation: 'glitch 0.3s infinite'
                          }}
                        >
                          {lastNameGlitchText}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={basicInfo.lastName}
                    onChange={(e) => {
                      handleNameChange('lastName', e.target.value);
                      if (e.target.value) {
                        setLastNameGlitching(false);
                      }
                    }}
                    onFocus={() => {
                      setLastNameFocused(true);
                      setLastNameGlitching(false);
                    }}
                    onBlur={() => {
                      setLastNameFocused(false);
                      if (!basicInfo.lastName) {
                        setLastNameGlitching(true);
                      }
                    }}
                    className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.lastName ? 'border-red-500' : 'border-gray-600'
                    } ${!basicInfo.lastName && lastNameGlitching ? 'text-transparent' : ''}`}
                    placeholder={lastNameGlitching ? '' : 'Enter your last name'}
                    required
                  />
                  
                  {/* Clear Button */}
                  {basicInfo.lastName && (
                    <button
                      type="button"
                      onClick={() => clearField('lastName')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
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
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                    fieldErrors.email ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder="juan@gmail.com"
                  required
                />
                
                {/* Clear Button */}
                {basicInfo.email && (
                  <button
                    type="button"
                    onClick={() => {
                      clearField('email');
                      setShowEmailSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                {/* Email Domain Suggestions */}
                {showEmailSuggestions && emailDomainSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {emailDomainSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setBasicInfo(prev => ({ ...prev, email: suggestion }));
                          setShowEmailSuggestions(false);
                          clearFieldError('email');
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-600 transition-colors flex items-center"
                      >
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
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
                    placeholder="0925-643-3456"
                    maxLength={13}
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
                  
                  {/* Glitch Animation Overlay */}
                  {isGlitching && !jobTitleFocused && !profileDetails.jobTitle && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-green-400 font-mono text-sm">
                        <span 
                          className="glitch-text"
                          style={{
                            textShadow: '0 0 5px rgba(34, 197, 94, 0.5)',
                            animation: 'glitch 0.3s infinite'
                          }}
                        >
                          {glitchText}
                        </span>
                      </div>
                    </div>
                  )}
                  
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
                  
                  <input
                    type="text"
                    value={profileDetails.jobTitle}
                    onChange={(e) => {
                      handleJobTitleChange(e.target.value);
                      if (e.target.value) {
                        setIsGlitching(false);
                      }
                    }}
                    onFocus={() => {
                      setJobTitleFocused(true);
                      setIsGlitching(false);
                      if (profileDetails.jobTitle) {
                        const suggestions = BARANGAY_JOBS.filter(job =>
                          job.toLowerCase().includes(profileDetails.jobTitle.toLowerCase())
                        ).slice(0, 5);
                        setJobSuggestions(suggestions);
                        setShowJobDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setJobTitleFocused(false);
                      if (!profileDetails.jobTitle) {
                        setIsGlitching(true);
                      }
                      setTimeout(() => setShowJobDropdown(false), 200);
                    }}
                    className={`w-full pl-10 pr-10 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400 ${
                      fieldErrors.jobTitle ? 'border-red-500' : 'border-gray-600'
                    } ${!profileDetails.jobTitle && isGlitching ? 'text-transparent' : ''}`}
                    placeholder={isGlitching ? '' : 'Start typing your job title...'}
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
            </div>
          )}

          {/* Step 2: Email Verification */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-5 duration-500">
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
            <div className="animate-in slide-in-from-right-5 duration-500">
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

                {/* Department Selection - Dropdown */}
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
                      {availableDepartments.map((dept) => (
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
                </div>

                {/* Access Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Access Role *
                  </label>
                  <p className="text-sm text-gray-400 mb-4">
                    Choose your role based on your responsibilities and goals
                  </p>
                  <div className="space-y-4">
                    {availableRoles.map((role) => {
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
                                <div className="mb-3">
                                  <h5 className={`text-xs font-medium mb-2 ${
                                    profileDetails.role === role.value ? 'text-green-300' : 'text-gray-300'
                                  }`}>
                                    🎯 What you can do:
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

                                {/* Life Improvements */}
                                <div>
                                  <h5 className={`text-xs font-medium mb-2 ${
                                    profileDetails.role === role.value ? 'text-green-300' : 'text-gray-300'
                                  }`}>
                                    🌟 How this improves your life:
                                  </h5>
                                  <ul className="space-y-1">
                                    {role.lifeImprovements.map((improvement, index) => (
                                      <li key={index} className={`text-xs ${
                                        profileDetails.role === role.value ? 'text-green-400' : 'text-gray-400'
                                      }`}>
                                        • {improvement}
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
            </div>
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
                    Log In
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
