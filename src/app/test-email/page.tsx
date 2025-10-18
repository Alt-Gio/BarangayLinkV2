"use client";

import { useState, useEffect } from 'react';
import { Mail, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Check if Resend is configured
    fetch('/api/test-email')
      .then(res => res.json())
      .then(data => {
        if (data.ready) {
          setIsConfigured(true);
          setMessage(data.message);
        } else {
          setMessage(data.message);
        }
      })
      .catch(() => {
        setMessage('❌ Could not check email configuration');
      });
  }, []);

  const sendTestEmail = async () => {
    if (!email) {
      setMessage('❌ Please enter an email address');
      return;
    }

    setStatus('sending');
    setMessage('');

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        const errorMsg = data.errorDetails?.message || data.message || 'Failed to send email';
        const fullError = JSON.stringify(data.error || data.errorDetails, null, 2);
        setMessage(`${errorMsg}\n\nError Details:\n${fullError}`);
        console.error('Email send error:', data);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('❌ Error: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
            <Mail className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">📧 Email System Test</h1>
          <p className="text-gray-400">Test your Resend email integration</p>
        </div>

        {/* Configuration Status */}
        <div className={`p-6 rounded-lg border mb-6 ${
          isConfigured 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-center gap-3">
            {isConfigured ? (
              <CheckCircle className="w-6 h-6 text-emerald-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <p className="font-semibold text-white">
                {isConfigured ? '✅ Resend API Configured' : '❌ Resend API Not Configured'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {isConfigured 
                  ? 'Your email system is ready to send invitations!' 
                  : 'Add RESEND_API_KEY to your .env.local file'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Form */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Send Test Email</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={!isConfigured}
              />
            </div>

            <button
              onClick={sendTestEmail}
              disabled={!isConfigured || status === 'sending'}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Test Email
                </>
              )}
            </button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg border ${
              status === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : status === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              <pre className="text-sm font-medium whitespace-pre-wrap break-words">{message}</pre>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        {!isConfigured && (
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">⚙️ Setup Required</h3>
            <ol className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="font-mono bg-slate-800 px-2 py-1 rounded">1</span>
                <span>Go to <a href="https://resend.com/signup" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">resend.com/signup</a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono bg-slate-800 px-2 py-1 rounded">2</span>
                <span>Create account (FREE - 100 emails/day)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono bg-slate-800 px-2 py-1 rounded">3</span>
                <span>Get your API key (starts with `re_`)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono bg-slate-800 px-2 py-1 rounded">4</span>
                <span>Add to .env.local: <code className="bg-slate-900 px-2 py-1 rounded text-xs">RESEND_API_KEY=re_your_key</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono bg-slate-800 px-2 py-1 rounded">5</span>
                <span>Restart dev server: <code className="bg-slate-900 px-2 py-1 rounded text-xs">npm run dev</code></span>
              </li>
            </ol>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
