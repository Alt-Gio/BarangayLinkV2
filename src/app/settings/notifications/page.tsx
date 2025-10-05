"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/Sidebar";
import { Bell, Mail, MessageSquare, Calendar, CheckSquare, Briefcase, Menu } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NotificationSettingsPage() {
  const { user, isLoaded } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentUser = useQuery(api.users.getCurrentUser);
  const preferences = useQuery(
    api.emailNotifications.getNotificationPreferences,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const updatePreferences = useMutation(api.emailNotifications.updateNotificationPreferences);

  const [localPrefs, setLocalPrefs] = useState(preferences || {
    email: {
      taskAssigned: true,
      taskCompleted: true,
      projectUpdates: true,
      eventReminders: true,
      messages: true,
      digest: {
        enabled: true,
        frequency: 'weekly',
      },
    },
    inApp: {
      all: true,
    },
  });

  // Update local preferences when fetched
  useState(() => {
    if (preferences) {
      setLocalPrefs(preferences);
    }
  });

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);
    try {
      await updatePreferences({
        userId: currentUser._id,
        preferences: localPrefs,
      });
      alert('Notification preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateEmailPref = (key: string, value: any) => {
    setLocalPrefs({
      ...localPrefs,
      email: {
        ...localPrefs.email,
        [key]: value,
      },
    });
  };

  const updateDigestPref = (key: string, value: any) => {
    setLocalPrefs({
      ...localPrefs,
      email: {
        ...localPrefs.email,
        digest: {
          ...localPrefs.email.digest,
          [key]: value,
        },
      },
    });
  };

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Sidebar
        userRole={currentUser?.userLevel?.name || "WORKER"}
        dashboardTitle="Notification Settings"
        dashboardSubtitle="Manage your notifications"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-700 text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white">Notifications</h1>
          <div className="w-9" />
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-emerald-500" />
              Notification Settings
            </h1>
            <p className="text-gray-400 mt-2">
              Choose how and when you want to be notified
            </p>
          </div>

          {/* Email Notifications */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-500" />
                Email Notifications
              </CardTitle>
              <CardDescription className="text-gray-400">
                Receive updates via email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-white font-medium">Task Assignments</p>
                    <p className="text-sm text-gray-400">When you're assigned a new task</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.email?.taskAssigned}
                  onCheckedChange={(checked) => updateEmailPref('taskAssigned', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white font-medium">Task Completions</p>
                    <p className="text-sm text-gray-400">When your tasks are completed</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.email?.taskCompleted}
                  onCheckedChange={(checked) => updateEmailPref('taskCompleted', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-white font-medium">Project Updates</p>
                    <p className="text-sm text-gray-400">Updates on projects you're involved in</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.email?.projectUpdates}
                  onCheckedChange={(checked) => updateEmailPref('projectUpdates', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-white font-medium">Event Reminders</p>
                    <p className="text-sm text-gray-400">Reminders for upcoming events</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.email?.eventReminders}
                  onCheckedChange={(checked) => updateEmailPref('eventReminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-pink-500" />
                  <div>
                    <p className="text-white font-medium">Messages</p>
                    <p className="text-sm text-gray-400">New chat messages</p>
                  </div>
                </div>
                <Switch
                  checked={localPrefs.email?.messages}
                  onCheckedChange={(checked) => updateEmailPref('messages', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Digest Emails */}
          <Card className="bg-gray-800/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                📊 Digest Emails
              </CardTitle>
              <CardDescription className="text-gray-400">
                Receive periodic summaries of your activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Enable Digest Emails</p>
                  <p className="text-sm text-gray-400">Get a summary of your activities</p>
                </div>
                <Switch
                  checked={localPrefs.email?.digest?.enabled}
                  onCheckedChange={(checked) => updateDigestPref('enabled', checked)}
                />
              </div>

              {localPrefs.email?.digest?.enabled && (
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-white font-medium mb-3">Frequency</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => updateDigestPref('frequency', 'daily')}
                      className={`flex-1 p-3 rounded-lg transition-colors ${
                        localPrefs.email?.digest?.frequency === 'daily'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      onClick={() => updateDigestPref('frequency', 'weekly')}
                      className={`flex-1 p-3 rounded-lg transition-colors ${
                        localPrefs.email?.digest?.frequency === 'weekly'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
