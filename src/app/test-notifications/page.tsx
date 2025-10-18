"use client";

import { useState } from 'react';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { Bell, CheckCircle, MessageSquare, Calendar, Clock, Trophy, AlertCircle } from 'lucide-react';
import { FCMTokenDebug } from '@/components/notifications/FCMTokenDebug';

export default function TestNotificationsPage() {
  const { permission, isSupported, requestPermission, token, isLoading } = useNotificationPermission();
  const [testStatus, setTestStatus] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<string>('');

  // Run diagnostics
  const runDiagnostics = () => {
    const checks: string[] = [];
    
    // Check 1: Browser support
    checks.push(`✅ Browser supports notifications: ${'Notification' in window}`);
    
    // Check 2: Permission status
    checks.push(`Permission: ${Notification.permission}`);
    
    // Check 3: Service worker
    checks.push(`✅ Service Worker supported: ${'serviceWorker' in navigator}`);
    
    // Check 4: Document visibility
    checks.push(`Document visible: ${document.visibilityState}`);
    
    // Check 5: Focus
    checks.push(`Window focused: ${document.hasFocus()}`);
    
    setDiagnostics(checks.join('\n'));
    console.log('📊 Diagnostics:', checks);
  };

  // Test basic browser notification (doesn't use FCM)
  const testBrowserNotification = () => {
    if (!('Notification' in window)) {
      setTestStatus('❌ Notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('🔔 Test Notification', {
          body: 'This is a basic browser notification test',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test',
          requireInteraction: false,
        });
        
        notification.onclick = () => {
          console.log('Notification clicked!');
          window.focus();
        };
        
        console.log('✅ Notification created successfully');
        setTestStatus('✅ Browser notification sent! Check your screen corners!');
      } catch (error) {
        console.error('Failed to create notification:', error);
        setTestStatus(`❌ Error: ${error}`);
      }
    } else {
      setTestStatus(`⚠️ Permission status: ${Notification.permission}. Please enable notifications first.`);
    }
  };

  // Test different notification types
  const testNotification = (type: string) => {
    if (Notification.permission !== 'granted') {
      setTestStatus('⚠️ Please grant permission first');
      return;
    }

    const notifications: Record<string, any> = {
      task: {
        title: '📋 New Task Assigned',
        body: 'Marc assigned you: "Road Drainage Repair"',
        icon: '/icon-192x192.png',
        tag: 'task-test',
        requireInteraction: false,
        actions: [
          { action: 'view', title: 'View Task' },
          { action: 'later', title: 'Later' },
        ]
      },
      message: {
        title: '💬 Marc',
        body: 'Hey, can you help with the event tomorrow?',
        icon: '/icon-192x192.png',
        tag: 'message-test',
      },
      event: {
        title: '📅 Event in 1 hour',
        body: 'Road Drainage Project starts soon!',
        icon: '/icon-192x192.png',
        tag: 'event-test',
        requireInteraction: true,
      },
      deadline: {
        title: '🚨 Task Due in 1 hour!',
        body: '"Road Drainage Repair"',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'deadline-test',
        requireInteraction: true,
        actions: [
          { action: 'view', title: 'View Task' },
          { action: 'snooze', title: 'Snooze' },
        ]
      },
      timer: {
        title: '⏱️ Working on: Road Drainage',
        body: 'Time: 02:34:15\nStarted: 10:15 AM',
        icon: '/icon-192x192.png',
        tag: 'work-timer',
        requireInteraction: true,
        silent: true,
        actions: [
          { action: 'stop', title: 'Stop Timer' },
          { action: 'pause', title: 'Pause' },
          { action: 'note', title: 'Add Note' },
        ]
      },
      achievement: {
        title: '🏆 Achievement Unlocked!',
        body: '10 Hour Master: You\'ve contributed 10 hours to community projects!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'achievement',
        requireInteraction: true,
      },
      digest: {
        title: '📬 Daily Summary',
        body: '📋 3 pending tasks\n💬 2 unread messages\n📅 1 upcoming event',
        icon: '/icon-192x192.png',
        tag: 'daily-digest',
      },
      overdue: {
        title: '❌ Task Overdue!',
        body: '"Road Drainage Repair" - Please complete ASAP',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'overdue',
        requireInteraction: true,
      }
    };

    const config = notifications[type];
    if (config) {
      try {
        const notification = new Notification(config.title, {
          body: config.body,
          icon: config.icon,
          badge: config.badge,
          tag: config.tag,
          requireInteraction: config.requireInteraction,
          silent: config.silent,
          // Note: actions only work in service worker, not here
        });
        
        notification.onclick = () => {
          console.log(`${type} notification clicked!`);
          window.focus();
        };
        
        console.log(`✅ ${type} notification created`);
        setTestStatus(`✅ ${type} notification sent! Look at your screen corners!`);
      } catch (error) {
        console.error(`Failed to create ${type} notification:`, error);
        setTestStatus(`❌ Error creating ${type} notification: ${error}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🔔 Notification Testing</h1>
        <p className="text-gray-400 mb-8">Test push notifications on your desktop</p>

        {/* Permission Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Permission Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
              <span>Browser Support</span>
              <span className={isSupported ? 'text-green-400' : 'text-red-400'}>
                {isSupported ? '✅ Supported' : '❌ Not Supported'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
              <span>Permission Status</span>
              <span className={
                permission === 'granted' ? 'text-green-400' :
                permission === 'denied' ? 'text-red-400' : 'text-yellow-400'
              }>
                {permission === 'granted' ? '✅ Granted' :
                 permission === 'denied' ? '❌ Denied' :
                 '⏳ Not Asked'}
              </span>
            </div>

            <div className="p-3 bg-gray-700/50 rounded">
              <div className="flex items-center justify-between mb-2">
                <span>FCM Token</span>
                <span className={token ? 'text-green-400' : 'text-gray-400'}>
                  {token ? '✅ Connected' : '⚠️ Not yet generated'}
                </span>
              </div>
              {token && (
                <div className="text-xs text-gray-400 font-mono break-all">
                  {token.substring(0, 50)}...
                </div>
              )}
            </div>
          </div>

          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="mt-4 w-full bg-teal-600 hover:bg-teal-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Requesting Permission...</span>
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  <span>Enable Notifications</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Test Status */}
        {testStatus && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-center text-sm">{testStatus}</p>
          </div>
        )}

        {/* Diagnostics */}
        {diagnostics && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold mb-2">📊 System Diagnostics:</p>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{diagnostics}</pre>
          </div>
        )}

        {/* Windows Notification Settings Check */}
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">⚠️ If notifications aren't appearing:</p>
            <button
              onClick={runDiagnostics}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-xs rounded transition"
            >
              Run Diagnostics
            </button>
          </div>
          <ol className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
            <li>Press <kbd className="px-2 py-1 bg-gray-700 rounded">Windows + I</kbd> to open Settings</li>
            <li>Go to <strong>System → Notifications</strong></li>
            <li>Make sure <strong>"Notifications"</strong> toggle is ON</li>
            <li>Turn OFF <strong>"Do not disturb"</strong> if it's on</li>
            <li>Scroll down and make sure <strong>Chrome/Edge</strong> is allowed to send notifications</li>
          </ol>
        </div>

        {/* Basic Test */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Basic Test</h2>
          <button
            onClick={testBrowserNotification}
            disabled={permission !== 'granted'}
            className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Bell className="w-5 h-5" />
            <span>Send Test Notification</span>
          </button>
          <p className="text-sm text-gray-400 mt-2 text-center">
            Click to see a basic notification appear on your desktop
          </p>
        </div>

        {/* Notification Type Tests */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Test Different Types</h2>
          <p className="text-sm text-gray-400 mb-4">
            Click any button below to see that notification type on your desktop
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Task Assignment */}
            <button
              onClick={() => testNotification('task')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5 text-teal-400" />
              <div className="text-left">
                <div className="font-semibold">Task Assignment</div>
                <div className="text-xs text-gray-400">📋 New task assigned</div>
              </div>
            </button>

            {/* New Message */}
            <button
              onClick={() => testNotification('message')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <div className="font-semibold">New Message</div>
                <div className="text-xs text-gray-400">💬 Chat message</div>
              </div>
            </button>

            {/* Event Reminder */}
            <button
              onClick={() => testNotification('event')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <div className="font-semibold">Event Reminder</div>
                <div className="text-xs text-gray-400">📅 Event starting soon</div>
              </div>
            </button>

            {/* Deadline */}
            <button
              onClick={() => testNotification('deadline')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <div className="font-semibold">Deadline Alert</div>
                <div className="text-xs text-gray-400">🚨 Task due soon</div>
              </div>
            </button>

            {/* Work Timer */}
            <button
              onClick={() => testNotification('timer')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Clock className="w-5 h-5 text-orange-400" />
              <div className="text-left">
                <div className="font-semibold">Work Timer</div>
                <div className="text-xs text-gray-400">⏱️ Persistent timer</div>
              </div>
            </button>

            {/* Achievement */}
            <button
              onClick={() => testNotification('achievement')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trophy className="w-5 h-5 text-yellow-400" />
              <div className="text-left">
                <div className="font-semibold">Achievement</div>
                <div className="text-xs text-gray-400">🏆 Unlock celebration</div>
              </div>
            </button>

            {/* Daily Digest */}
            <button
              onClick={() => testNotification('digest')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bell className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <div className="font-semibold">Daily Digest</div>
                <div className="text-xs text-gray-400">📬 Morning summary</div>
              </div>
            </button>

            {/* Overdue */}
            <button
              onClick={() => testNotification('overdue')}
              disabled={permission !== 'granted'}
              className="flex items-center gap-3 p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="text-left">
                <div className="font-semibold">Overdue Task</div>
                <div className="text-xs text-gray-400">❌ Task is overdue</div>
              </div>
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="font-semibold mb-2 text-xl">📝 How to See Desktop Notifications:</h3>
          <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
            <li>Make sure you're on <strong>desktop</strong> (Windows, Mac, or Linux)</li>
            <li>Click <strong>"Enable Notifications"</strong> button above</li>
            <li>When browser asks permission, click <strong>"Allow"</strong></li>
            <li>Click any notification type button (Task, Message, etc.)</li>
            <li><strong className="text-yellow-400">👀 LOOK AT YOUR SCREEN CORNERS:</strong>
              <ul className="ml-6 mt-2 space-y-1 list-disc">
                <li><strong>Windows:</strong> Bottom-right corner of screen</li>
                <li><strong>Mac:</strong> Top-right corner of screen</li>
                <li><strong>Linux:</strong> Usually top-right corner</li>
              </ul>
            </li>
          </ol>

          <div className="mt-4 p-4 bg-yellow-900/30 rounded border border-yellow-500/30">
            <p className="text-sm font-semibold mb-2">
              ⚠️ <strong>Important:</strong> Desktop notifications appear OUTSIDE the browser window!
            </p>
            <p className="text-sm text-gray-300">
              They look like system notifications from Windows/Mac. Don't look inside the browser - look at your actual desktop screen corners!
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-900/30 rounded border border-blue-500/30">
            <p className="text-sm font-semibold mb-2">
              💡 Still not seeing them?
            </p>
            <ul className="ml-4 space-y-1 list-disc text-xs text-gray-300">
              <li>Check Windows Settings → System → Notifications (turn ON)</li>
              <li>Make sure "Do Not Disturb" is OFF</li>
              <li>Try in a different browser (Chrome works best)</li>
              <li>Check browser console (F12) for errors</li>
            </ul>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* FCM Token Debug Widget */}
      <FCMTokenDebug />
    </div>
  );
}
