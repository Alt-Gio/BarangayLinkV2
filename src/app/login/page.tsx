"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSignIn, useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, ArrowLeft, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const clerk = useClerk();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    if (!isLoaded) return;
    
    setIsLoading(true);
    
    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem('barangay_remember_email', email);
        } else {
          localStorage.removeItem('barangay_remember_email');
        }
        
        router.push('/dashboard');
      } else {
        setError('Sign in failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.errors && err.errors[0]) {
        setError(err.errors[0].message);
      } else {
        setError('An error occurred during sign in. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setResetLoading(true);
    setError('');
    
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmail,
      });
      
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      if (err.errors && err.errors[0]) {
        setError(err.errors[0].message);
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  // Check for existing session and load remembered email on component mount
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // User is already signed in, redirect to dashboard
      router.push('/dashboard');
      return;
    }

    // Load remembered email
    const rememberedEmail = localStorage.getItem('barangay_remember_email');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Back to Login */}
          <div className="mb-8">
            <button 
              onClick={() => {
                setShowForgotPassword(false);
                setResetSuccess(false);
                setError('');
              }}
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </div>

          {/* Reset Password Card */}
          <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Reset Password
              </h1>
              <p className="text-gray-400">
                Enter your email to receive a password reset link
              </p>
            </div>

            {resetSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Email Sent!</h3>
                <p className="text-gray-400 mb-6">
                  Check your email for password reset instructions.
                </p>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSuccess(false);
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                {error && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send Reset Email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back to Home and Clear Session */}
        <div className="mb-8 flex justify-between items-center">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <button
            onClick={async () => {
              try {
                await clerk.signOut();
                setError('');
                setEmail('');
                setPassword('');
                window.location.reload();
              } catch (err) {
                console.log('Error signing out:', err);
              }
            }}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Clear Session
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400">
              Sign in to access BarangayLink services
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-300 text-sm">{error}</p>
                {error.includes('session') && (
                  <button
                    onClick={async () => {
                      try {
                        await clerk.signOut();
                        setError('');
                        setEmail('');
                        setPassword('');
                        window.location.reload();
                      } catch (err) {
                        console.log('Error clearing session:', err);
                      }
                    }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    Clear existing session and try again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-white placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-600 text-green-600 focus:ring-green-500 bg-gray-700" 
                />
                <span className="ml-2 text-sm text-gray-400">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isLoaded}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-600"></div>
            <span className="px-3 text-sm text-gray-400">Or</span>
            <div className="flex-1 border-t border-gray-600"></div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-2">
            Need immediate assistance?
          </p>
          <a 
            href="tel:(052) 742-0123" 
            className="text-red-400 font-semibold hover:text-red-300 transition-colors"
          >
            Emergency Hotline: (052) 742-0123
          </a>
        </div>
      </div>
    </div>
  );
}
