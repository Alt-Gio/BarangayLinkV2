"use client";

import Link from 'next/link';
import { ArrowLeft, Lock, Eye, Shield, Heart, Database, UserCheck } from 'lucide-react';

// Force dynamic rendering since this page is wrapped by ClerkProvider
export const dynamic = 'force-dynamic';

export default function PrivacyPolicy() {
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
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-400">How we protect and use your information</p>
            <p className="text-sm text-gray-500 mt-2">Last updated: September 25, 2024</p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
          <div className="prose prose-invert max-w-none">
            
            {/* Promise */}
            <div className="mb-8 p-6 bg-blue-900/20 rounded-lg border border-blue-700">
              <div className="flex items-center mb-3">
                <Heart className="w-5 h-5 text-blue-400 mr-2" />
                <h2 className="text-xl font-semibold text-blue-300 m-0">Our Privacy Promise 🤝</h2>
              </div>
              <p className="text-blue-100 m-0">
                Your privacy matters to us! We only collect what we need to make BarangayLink work great for you, 
                and we&apos;ll never sell your information to anyone. Promise!
              </p>
            </div>

            {/* What We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Database className="w-6 h-6 text-green-400 mr-2" />
                What Information We Collect
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-700/50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                    <UserCheck className="w-5 h-5 mr-2" />
                    Basic Info
                  </h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Your name and contact details</li>
                    <li>• Job title and department</li>
                    <li>• Profile picture (if you choose to add one)</li>
                    <li>• Your role in the community</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-3">
                    <strong>Why?</strong> So we can identify you and connect you with the right services!
                  </p>
                </div>

                <div className="bg-gray-700/50 p-5 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Usage Data
                  </h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• Which features you use most</li>
                    <li>• When you log in and out</li>
                    <li>• Your activity on projects and tasks</li>
                    <li>• Device and browser info</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-3">
                    <strong>Why?</strong> To make the platform work better and fix any problems!
                  </p>
                </div>
              </div>
            </section>

            {/* How We Use It */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Shield className="w-6 h-6 text-green-400 mr-2" />
                How We Use Your Information
              </h2>
              
              <div className="space-y-4">
                <div className="bg-green-900/20 p-4 rounded-lg border border-green-700">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">✅ The Good Stuff We Do</h3>
                  <ul className="text-green-100 space-y-1 text-sm">
                    <li>• Connect you with barangay services</li>
                    <li>• Show you relevant community projects</li>
                    <li>• Send you important updates</li>
                    <li>• Help you track your contributions</li>
                    <li>• Improve the platform based on how you use it</li>
                  </ul>
                </div>

                <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
                  <h3 className="text-lg font-semibold text-red-300 mb-2">❌ What We DON'T Do</h3>
                  <ul className="text-red-100 space-y-1 text-sm">
                    <li>• Sell your information to companies</li>
                    <li>• Share your data without permission</li>
                    <li>• Send you spam or unwanted ads</li>
                    <li>• Use your info for anything sketchy</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Who We Share With */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Who Can See Your Information?</h2>
              
              <div className="space-y-4 text-gray-300">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">🏛️ Barangay Officials</h3>
                  <p className="text-sm">
                    Your barangay officials can see your basic info and activity to help provide you with services. 
                    They&apos;re bound by the same privacy rules we are!
                  </p>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">👥 Other Community Members</h3>
                  <p className="text-sm">
                    Only your name and role are visible to other users when you participate in community projects. 
                    Your contact details stay private unless you choose to share them.
                  </p>
                </div>

                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-2">🔒 Nobody Else</h3>
                  <p className="text-sm">
                    We don&apos;t share your information with advertisers, data brokers, or random companies. 
                    Your data stays within our community!
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Your Rights & Controls</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-purple-900/20 p-4 rounded-lg border border-purple-700">
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">👀 See Your Data</h3>
                    <p className="text-purple-100 text-sm">
                      Want to know what info we have about you? Just ask! We&apos;ll show you everything.
                    </p>
                  </div>

                  <div className="bg-orange-900/20 p-4 rounded-lg border border-orange-700">
                    <h3 className="text-lg font-semibold text-orange-300 mb-2">✏️ Update Your Info</h3>
                    <p className="text-orange-100 text-sm">
                      You can change your information anytime through your profile settings.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-red-900/20 p-4 rounded-lg border border-red-700">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">🗑️ Delete Your Account</h3>
                    <p className="text-red-100 text-sm">
                      Want to leave? No problem! We&apos;ll delete your account and data completely.
                    </p>
                  </div>

                  <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-700">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-2">📧 Control Communications</h3>
                    <p className="text-yellow-100 text-sm">
                      Choose what notifications you want to receive and how often.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">How We Keep Your Data Safe</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">We take security seriously!</strong> Your data is encrypted, 
                  stored securely, and protected by multiple layers of security. We regularly update our 
                  systems to keep everything safe.
                </p>
                <p>
                  <strong className="text-white">Your part:</strong> Keep your password strong and don&apos;t share 
                  your login details with anyone. If something seems fishy, let us know right away!
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Cookies & Tracking</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  <strong className="text-white">We use cookies</strong> (the digital kind, not the yummy ones 🍪) 
                  to remember your login and preferences. They help make the site work better for you.
                </p>
                <p>
                  <strong className="text-white">No creepy tracking!</strong> We don&apos;t follow you around the internet 
                  or build detailed profiles for advertising. Our cookies are just for making BarangayLink work smoothly.
                </p>
              </div>
            </section>

            {/* Changes */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  If we need to update this policy, we&apos;ll let you know in advance and explain what&apos;s changing. 
                  Big changes will require your approval before they take effect.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Questions or Concerns?</h2>
              <div className="bg-green-900/20 p-6 rounded-lg border border-green-700">
                <p className="text-green-100 m-0">
                  Have questions about your privacy or how we handle your data? We&apos;re here to help! 
                  Contact your barangay office or reach out through our support channels. 
                  We believe in being transparent and will gladly explain anything you want to know.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-700 pt-8 mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Your trust is important to us. We&apos;re committed to protecting your privacy and being transparent 
                about how we handle your information. Thank you for being part of our community! 💙
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
