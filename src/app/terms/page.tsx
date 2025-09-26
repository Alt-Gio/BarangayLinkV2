"use client";

import Link from 'next/link';
import { ArrowLeft, Shield, Users, Heart, CheckCircle } from 'lucide-react';

// Force dynamic rendering since this page is wrapped by ClerkProvider
export const dynamic = 'force-dynamic';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/register"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Registration
          </Link>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
            <p className="text-gray-400">Simple, friendly rules for our community</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: September 25, 2024</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="prose prose-invert max-w-none">
            
            {/* Welcome */}
            <div className="mb-8 p-6 bg-green-900/20 rounded-lg border border-green-700">
              <div className="flex items-center mb-3">
                <Heart className="w-5 h-5 text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-green-300 m-0">Welcome to BarangayLink! 👋</h2>
              </div>
              <p className="text-green-100 m-0">
                We&apos;re excited to have you join our community! These terms are here to keep everyone safe and happy. 
                Don&apos;t worry - we&apos;ve kept them simple and straightforward.
              </p>
            </div>

            {/* The Basics */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                The Basics
              </h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">What is BarangayLink?</strong><br />
                  We're a digital platform that helps connect community members with their barangay government. 
                  Think of us as your friendly neighborhood digital assistant!
                </p>
                <p>
                  <strong className="text-white">Who can use it?</strong><br />
                  Anyone who&apos;s part of our barangay community. You just need to be honest about who you are 
                  and follow our simple community guidelines.
                </p>
              </div>
            </section>

            {/* Your Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Users className="w-6 h-6 text-green-400 mr-2" />
                Your Responsibilities (The Good Stuff)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">✅ Do These Things</h3>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• Be respectful to everyone</li>
                    <li>• Use your real information</li>
                    <li>• Keep your password safe</li>
                    <li>• Report any problems you find</li>
                    <li>• Help make our community better</li>
                  </ul>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">❌ Please Don't Do These</h3>
                  <ul className="text-gray-300 space-y-1 text-sm">
                    <li>• Share fake information</li>
                    <li>• Be mean to other users</li>
                    <li>• Try to break our system</li>
                    <li>• Share other people's private info</li>
                    <li>• Use the platform for illegal stuff</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Your Account */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Your Account & Data</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">Your account is yours!</strong> You control your information and can update 
                  or delete it anytime. We'll keep your data safe and only use it to make the platform work better for you.
                </p>
                <p>
                  <strong className="text-white">If you want to leave,</strong> just let us know and we&apos;ll help you delete 
                  your account. No hard feelings! 😊
                </p>
              </div>
            </section>

            {/* Service Availability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Service & Support</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">We try our best,</strong> but sometimes things might not work perfectly. 
                  We&apos;re always working to improve and fix any issues quickly.
                </p>
                <p>
                  <strong className="text-white">Need help?</strong> Contact your barangay office or reach out through 
                  our support channels. We&apos;re here to help!
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Updates to These Terms</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Sometimes we might need to update these terms (like when we add cool new features!). 
                  If we make big changes, we&apos;ll let you know ahead of time.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Questions?</h2>
              <div className="bg-blue-900/20 p-6 rounded-lg border border-blue-700">
                <p className="text-blue-100 m-0">
                  Got questions about these terms? No problem! Contact your barangay office or send us a message. 
                  We&apos;re always happy to help explain anything that&apos;s not clear.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-700 pt-8 mt-8 text-center">
              <p className="text-gray-400 text-sm">
                By using BarangayLink, you&apos;re agreeing to these terms and helping build a better community. 
                Thanks for being awesome! 🌟
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
