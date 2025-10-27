"use client";

import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineData } from '@/contexts/OfflineDataContext';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Settings,
  Building,
  Shield,
  Bell,
  Database,
  Activity,
  Info,
  Save,
  RefreshCw,
  Download,
  Upload,
  Mail,
  Globe,
  Lock,
  Users,
  Calendar,
  Menu,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Clock,
  HardDrive,
  Send,
  AlertTriangle,
  CheckCheck,
} from "lucide-react";
import RippleLoader from "@/components/ui/RippleLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminGuard } from "@/components/admin/AdminGuard";

export const dynamic = "force-dynamic";

export default function SystemSettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Get current user from offline context (cached, saves bandwidth)
  const { currentUser, isOnline } = useOfflineData();
  const departments = useQuery(api.departments.getAllDepartmentsWithStats);
  const userLevels = useQuery(api.departments.getAllUserLevels);
  const backups = useQuery(api.backup.getAllBackups);
  const backupSchedule = useQuery(api.backup.getBackupSchedule);
  const securitySettings = useQuery(api.securitySettings.getSecuritySettings);
  const activeSessions = useQuery(api.securitySettings.getActiveSessionsCount);
  
  // Actions and Mutations
  const createBackup = useAction(api.backup.createFullBackup);
  const restoreBackup = useAction(api.backup.restoreFromBackup);
  const importBackup = useAction(api.backup.importBackup);
  const deleteBackupMut = useMutation(api.backup.deleteBackup);
  const clearUsersAction = useAction(api.backup.clearUsersWithArchive);
  const clearAllDataAction = useAction(api.backup.clearAllDataWithArchive);
  const clearAllMessagesAction = useAction(api.backup.clearAllMessagesWithArchive);
  const removeDuplicateUsersAction = useAction(api.backup.removeDuplicateUsers);
  const removeDuplicateDepartmentsAction = useAction(api.backup.removeDuplicateDepartments);
  const removeDuplicateUserLevelsAction = useAction(api.backup.removeDuplicateUserLevels);
  const detectAllDuplicatesAction = useAction(api.backup.detectAllDuplicates);
  
  // Notification actions
  const checkOverdueAction = useAction(api.notificationSystem.checkOverdueProjects);
  const resendNotificationMut = useMutation(api.notificationSystem.resendNotification);
  const sendTestEmailAction = useAction(api.notificationSystem.sendTestEmail);
  const updateSecurityMut = useMutation(api.securitySettings.updateSecuritySettings);
  const forceLogoutAllMut = useMutation(api.securitySettings.forceLogoutAllUsers);
  const createDepartmentMut = useMutation(api.departments.createDepartment);
  const updateDepartmentMut = useMutation(api.departments.updateDepartment);
  const deleteDepartmentMut = useMutation(api.departments.deleteDepartment);
  const updateBackupScheduleMut = useMutation(api.backup.updateBackupSchedule);
  
  // Performance optimization
  const logStats = useQuery(api.performanceOptimization.getLogStatistics);
  const optimizeSystemMut = useMutation(api.performanceOptimization.optimizeSystem);
  const cleanupActivityLogsMut = useMutation(api.performanceOptimization.cleanupOldActivityLogs);
  const cleanupSearchHistoryMut = useMutation(api.performanceOptimization.cleanupOldSearchHistory);
  const cleanupProjectActivitiesMut = useMutation(api.performanceOptimization.cleanupOldProjectActivities);
  const cleanupInactiveSessionsMut = useMutation(api.performanceOptimization.cleanupInactiveSessions);

  // System settings state
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "BarangayLink",
    siteDescription: "Barangay Project Management System",
    contactEmail: "admin@barangaylink.gov",
    timezone: "Asia/Manila",
    fiscalYear: "2025-2026",
    
    // Security Settings
    sessionTimeout: "30",
    passwordMinLength: "8",
    requireMFA: false,
    allowPublicRegistration: false,
    
    // Notification Settings
    emailNotifications: true,
    projectUpdates: true,
    taskReminders: true,
    eventAlerts: true,
    
    // System Settings
    autoBackup: true,
    backupFrequency: "daily",
    retentionDays: "90",
    maintenanceMode: false,
  });

  const [newDepartment, setNewDepartment] = useState({ name: "", description: "", contactEmail: "", location: "", category: "General" });
  const [editingDept, setEditingDept] = useState<any>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [restoreInProgress, setRestoreInProgress] = useState(false);
  const [importInProgress, setImportInProgress] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<any>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [showClearMessagesModal, setShowClearMessagesModal] = useState(false);
  const [removingDuplicates, setRemovingDuplicates] = useState(false);
  const [removingDeptDuplicates, setRemovingDeptDuplicates] = useState(false);
  const [removingLevelDuplicates, setRemovingLevelDuplicates] = useState(false);
  const [scanningDuplicates, setScanningDuplicates] = useState(false);
  const [duplicateStats, setDuplicateStats] = useState({ users: 0, departments: 0, userLevels: 0, total: 0 });
  const [checkingProjects, setCheckingProjects] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState({ total: 0, overdue: 0 });

  const handleCreateBackup = async () => {
    if (backupInProgress) return;
    setBackupInProgress(true);
    try {
      const result = await createBackup({});
      alert(`Backup created successfully! ${result.totalRecords} records backed up.`);
    } catch (error: any) {
      alert(`Backup failed: ${error.message}`);
    } finally {
      setBackupInProgress(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartment.name || !newDepartment.description) {
      alert("Name and description are required");
      return;
    }
    try {
      await createDepartmentMut(newDepartment);
      setNewDepartment({ name: "", description: "", contactEmail: "", location: "", category: "General" });
      alert("Department created successfully!");
    } catch (error: any) {
      alert(`Failed to create department: ${error.message}`);
    }
  };

  const handleDeleteDepartment = async (id: any) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartmentMut({ id });
      alert("Department deleted successfully!");
    } catch (error: any) {
      alert(`Failed to delete department: ${error.message}`);
    }
  };

  const handleUpdateBackupSchedule = async () => {
    try {
      await updateBackupScheduleMut({
        frequency: settings.backupFrequency as any,
        time: "00:00",
        enabled: settings.autoBackup,
        retentionDays: parseInt(settings.retentionDays),
      });
      alert("Backup schedule updated successfully!");
    } catch (error: any) {
      alert(`Failed to update schedule: ${error.message}`);
    }
  };

  const handleRestoreBackup = async (backupId: any, clearExisting: boolean) => {
    if (!confirm(`Are you sure you want to restore this backup?${clearExisting ? ' This will CLEAR ALL EXISTING DATA first (it will be archived).' : ' This will merge with existing data.'}`)) return;
    
    setRestoreInProgress(true);
    try {
      const result = await restoreBackup({ backupId, clearExisting });
      if (result.success) {
        alert(`Backup restored successfully! ${result.recordsRestored} records restored.`);
        setShowRestoreModal(false);
        window.location.reload();
      } else {
        alert(`Restore failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Restore failed: ${error.message}`);
    } finally {
      setRestoreInProgress(false);
    }
  };

  const handleDownloadBackup = async (backupId: any) => {
    try {
      // Get the backup directly from the backups list
      const backup = backups?.find((b: any) => b._id === backupId);
      if (!backup || !backup.dataJson) {
        alert('Backup not found');
        return;
      }
      
      // Create download
      const filename = `barangaylink-backup-${backup.timestamp}.json`;
      const blob = new Blob([backup.dataJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert(`Download failed: ${error.message}`);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // First confirmation
    const confirmImport = confirm(
      '📥 IMPORT BACKUP\n\n' +
      'Ready to import: ' + file.name + '\n\n' +
      'Click OK to continue, Cancel to abort.'
    );
    if (!confirmImport) {
      event.target.value = '';
      return;
    }
    
    // Mode selection with clear options
    const clearExisting = confirm(
      '⚙️ CHOOSE IMPORT MODE\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Click OK to REPLACE all data:\n' +
      '  • Clears everything first\n' +
      '  • Creates archive backup\n' +
      '  • Then imports new data\n\n' +
      'Click CANCEL to MERGE:\n' +
      '  • Keeps existing data\n' +
      '  • Adds new records\n' +
      '  • May create duplicates\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      '💡 Recommended: CANCEL (Merge)\n'
    );
    
    setImportInProgress(true);
    try {
      const text = await file.text();
      
      // Validate JSON
      try {
        JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON file. Please check the file format.');
      }
      
      alert('⏳ Import starting...\n\nThis may take 30-60 seconds.\nPlease wait and do not close this window.');
      
      const result = await importBackup({ backupJson: text, clearExisting });
      
      if (result.success) {
        alert('✅ SUCCESS!\n\nBackup imported successfully.\nPage will reload to show new data.');
        window.location.reload();
      } else {
        alert('❌ IMPORT FAILED\n\n' + result.message);
      }
    } catch (error: any) {
      console.error('Import error:', error);
      
      // Check if this is a timeout error (connection lost)
      if (error.message && error.message.includes('Connection lost while action was in flight')) {
        alert(
          '⚠️ CONNECTION TIMEOUT\n\n' +
          '⏱️ The import process took longer than expected, causing a timeout.\n\n' +
          '✅ HOWEVER: Your data may have been imported successfully!\n\n' +
          'What happened:\n' +
          '• The import started correctly\n' +
          '• Data was being saved to the database\n' +
          '• The connection timed out before confirming\n\n' +
          '👉 Next Steps:\n' +
          '1. Click OK to refresh the page\n' +
          '2. Check if your data appears\n' +
          '3. If data is missing, try importing again\n\n' +
          '📊 Check browser console (F12) for detailed logs'
        );
        window.location.reload();
      } else {
        alert(
          '❌ IMPORT FAILED\n\n' +
          'Error: ' + error.message + '\n\n' +
          'Possible causes:\n' +
          '• Invalid JSON format\n' +
          '• Schema validation errors\n' +
          '• Database connection lost\n\n' +
          'Try:\n' +
          '1. Check browser console (F12) for details\n' +
          '2. Verify JSON file is valid\n' +
          '3. Try again in a few moments'
        );
      }
    } finally {
      setImportInProgress(false);
      event.target.value = '';
    }
  };

  const handleDeleteBackup = async (backupId: any) => {
    if (!confirm('Are you sure you want to delete this backup? This cannot be undone.')) return;
    
    try {
      await deleteBackupMut({ backupId });
      alert('Backup deleted successfully');
    } catch (error: any) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  const handleClearUsers = async (keepAdmins: boolean) => {
    const message = keepAdmins 
      ? 'This will CLEAR ALL USERS except admins. Current data will be archived first. Continue?'
      : 'This will CLEAR ALL USERS including admins. Current data will be archived first. Continue?';
    
    if (!confirm(message)) return;
    if (!confirm('Are you ABSOLUTELY SURE? This will delete user data (but it will be archived).')) return;
    
    try {
      const result = await clearUsersAction({ keepAdmins });
      if (result.success) {
        alert('Users cleared successfully. Data has been archived.');
        setShowClearModal(false);
        window.location.reload();
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to clear users: ${error.message}`);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('⚠️ This will CLEAR projects, events, milestones, tasks, and documents (USERS are preserved). Data will be archived first. Continue?')) return;
    if (!confirm('Are you ABSOLUTELY SURE? This will clear all project data but keep users and departments!')) return;
    
    try {
      const result = await clearAllDataAction({ keepSystemConfig: true });
      if (result.success) {
        alert('All data cleared successfully. Data has been archived.');
        setShowClearDataModal(false);
        window.location.reload();
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to clear data: ${error.message}`);
    }
  };

  const handleClearAllMessages = async () => {
    if (!confirm('⚠️ This will CLEAR ALL MESSAGES. Data will be archived first. Continue?')) return;
    if (!confirm('Are you ABSOLUTELY SURE? This will delete all messages from the system!')) return;
    
    try {
      const result = await clearAllMessagesAction({});
      if (result.success) {
        alert('All messages cleared successfully. Data has been archived.');
        setShowClearMessagesModal(false);
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to clear messages: ${error.message}`);
    }
  };

  const handleScanDuplicates = async () => {
    setScanningDuplicates(true);
    try {
      const result = await detectAllDuplicatesAction({});
      if (result.success) {
        setDuplicateStats(result.duplicates);
        if (result.duplicates.total === 0) {
          alert('✅ No duplicates found!\n\nYour database is clean.');
        } else {
          alert(
            `🔍 DUPLICATE DATA DETECTED\n\n` +
            `Users: ${result.duplicates.users}\n` +
            `Departments: ${result.duplicates.departments}\n` +
            `User Levels: ${result.duplicates.userLevels}\n\n` +
            `Total duplicates: ${result.duplicates.total}\n\n` +
            `Use the remove buttons below to clean up.`
          );
        }
      }
    } catch (error: any) {
      alert(`Failed to scan: ${error.message}`);
    } finally {
      setScanningDuplicates(false);
    }
  };

  const handleRemoveDuplicateUsers = async () => {
    if (!confirm('This will remove duplicate users from the database (keeping the oldest entry for each user). Continue?')) return;
    
    setRemovingDuplicates(true);
    try {
      const result = await removeDuplicateUsersAction({});
      if (result.success) {
        alert(`Success! Removed ${result.duplicatesRemoved} duplicate users. Please refresh the page.`);
        window.location.reload();
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to remove duplicates: ${error.message}`);
    } finally {
      setRemovingDuplicates(false);
    }
  };

  const handleRemoveDuplicateDepartments = async () => {
    if (!confirm('This will remove duplicate departments from the database (keeping the oldest entry for each department name). Continue?')) return;
    
    setRemovingDeptDuplicates(true);
    try {
      const result = await removeDuplicateDepartmentsAction({});
      if (result.success) {
        alert(`Success! Removed ${result.duplicatesRemoved} duplicate departments. Please refresh the page.`);
        window.location.reload();
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to remove duplicates: ${error.message}`);
    } finally {
      setRemovingDeptDuplicates(false);
    }
  };

  const handleRemoveDuplicateUserLevels = async () => {
    if (!confirm('This will remove duplicate user levels from the database (keeping the oldest entry for each level name). Continue?')) return;
    
    setRemovingLevelDuplicates(true);
    try {
      const result = await removeDuplicateUserLevelsAction({});
      if (result.success) {
        alert(`Success! Removed ${result.duplicatesRemoved} duplicate user levels. Please refresh the page.`);
        window.location.reload();
      } else {
        alert(`Failed: ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to remove duplicates: ${error.message}`);
    } finally {
      setRemovingLevelDuplicates(false);
    }
  };

  const handleCheckOverdueProjects = async () => {
    if (checkingProjects) return;
    setCheckingProjects(true);
    try {
      const result = await checkOverdueAction({});
      if (result.success) {
        setNotificationStats({ total: result.overdueCount, overdue: result.overdueCount });
        alert(`Found ${result.overdueCount} overdue projects. Notifications sent!`);
      }
    } catch (error: any) {
      alert(`Failed to check projects: ${error.message}`);
    } finally {
      setCheckingProjects(false);
    }
  };

  const handleResendNotification = async (notificationId: any) => {
    try {
      await resendNotificationMut({ notificationId });
      alert('Notification resent successfully!');
    } catch (error: any) {
      alert(`Failed to resend: ${error.message}`);
    }
  };

  const handleSendTestEmail = async () => {
    if (sendingTestEmail) return;
    setSendingTestEmail(true);
    try {
      const result = await sendTestEmailAction({});
      if (result.success) {
        alert(`✅ ${result.message}\n\nCheck your email inbox for the test message!`);
      } else {
        alert(`❌ ${result.message}`);
      }
    } catch (error: any) {
      alert(`Failed to send test email: ${error.message}`);
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleUpdateSecuritySettings = async () => {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      const result = await updateSecurityMut({
        sessionTimeout: parseInt(settings.sessionTimeout),
        passwordMinLength: parseInt(settings.passwordMinLength),
        requireMFA: settings.requireMFA,
        allowPublicRegistration: settings.allowPublicRegistration,
      });
      if (result.success) {
        alert('✅ Security settings updated successfully!');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error: any) {
      alert(`❌ Failed to update security settings: ${error.message}`);
      setSaveStatus('error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleForceLogoutAll = async () => {
    if (!confirm('⚠️ This will FORCE LOGOUT ALL USERS immediately. Continue?')) return;
    if (!confirm('Are you ABSOLUTELY SURE? This is an emergency security measure!')) return;
    
    try {
      const result = await forceLogoutAllMut({});
      if (result.success) {
        alert(`✅ ${result.message}\n\nAll users have been logged out.`);
      }
    } catch (error: any) {
      alert(`❌ Failed: ${error.message}`);
    }
  };

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <RippleLoader size="lg" color="emerald" text="Loading settings..." />
      </div>
    );
  }

  const handleSave = async () => {
    setSaveStatus("saving");
    // Simulate save
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 1000);
  };

  return (
    <AdminGuard>
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Sidebar
          userRole={currentUser?.userLevel?.name || "ADMIN"}
          dashboardTitle="System Settings"
          dashboardSubtitle="Configure system preferences"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="md:hidden bg-gray-800 p-4 flex items-center justify-between sticky top-0 z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">System Settings</h1>
            <div className="w-9" />
          </div>

          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 md:sticky md:top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                      <Settings className="w-8 h-8 text-emerald-500" />
                      System Settings
                    </h1>
                    <p className="text-gray-400 mt-1">Configure and manage system preferences</p>
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                  >
                    {saveStatus === "saving" ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : saveStatus === "saved" ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Settings Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-white/10 p-1 rounded-lg border border-white/20">
                  <TabsTrigger value="general" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Globe className="w-4 h-4 mr-2" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="departments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Building className="w-4 h-4 mr-2" />
                    Departments
                  </TabsTrigger>
                  <TabsTrigger value="security" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Lock className="w-4 h-4 mr-2" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="backup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Database className="w-4 h-4 mr-2" />
                    Backup
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Activity className="w-4 h-4 mr-2" />
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="system" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                    <Info className="w-4 h-4 mr-2" />
                    System Info
                  </TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-500" />
                      General Settings
                    </h2>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Site Name
                          </label>
                          <Input
                            value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contact Email
                          </label>
                          <Input
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Site Description
                        </label>
                        <Textarea
                          value={settings.siteDescription}
                          onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Timezone
                          </label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-md text-white"
                          >
                            <option value="Asia/Manila" className="bg-gray-800 text-white">Asia/Manila (GMT+8)</option>
                            <option value="Asia/Tokyo" className="bg-gray-800 text-white">Asia/Tokyo (GMT+9)</option>
                            <option value="UTC" className="bg-gray-800 text-white">UTC (GMT+0)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fiscal Year
                          </label>
                          <Input
                            value={settings.fiscalYear}
                            onChange={(e) => setSettings({ ...settings, fiscalYear: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Departments */}
                <TabsContent value="departments" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Building className="w-5 h-5 text-emerald-500" />
                      Department Management
                    </h2>
                    
                    {/* Add New Department */}
                    <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-lg p-4 mb-6">
                      <h3 className="text-white font-semibold mb-4">Add New Department</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Department Name"
                          value={newDepartment.name}
                          onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <Input
                          placeholder="Description"
                          value={newDepartment.description}
                          onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <Button 
                          onClick={handleCreateDepartment}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <Building className="w-4 h-4 mr-2" />
                          Add Department
                        </Button>
                      </div>
                    </div>

                    {/* Existing Departments */}
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold">Existing Departments</h3>
                      {departments?.map((dept: any) => (
                        <div
                          key={dept._id}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-white font-medium">{dept.name}</p>
                              <Badge className="bg-blue-600 text-white text-xs">
                                {dept.userCount || 0} users
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm">{dept.description}</p>
                            {dept.location && (
                              <p className="text-gray-500 text-xs mt-1">📍 {dept.location}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => setEditingDept(dept)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteDepartment(dept._id)}
                              disabled={dept.userCount > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-500" />
                      Security Management
                    </h2>
                    
                    {/* Security Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <Shield className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">MFA Status</div>
                            <div className="text-2xl font-bold text-white">
                              {securitySettings?.requireMFA ? 'Required' : 'Optional'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Users className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Active Sessions</div>
                            <div className="text-2xl font-bold text-white">{activeSessions?.count || 0}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-purple-500/20 rounded-lg">
                            <Lock className="w-6 h-6 text-purple-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Session Timeout</div>
                            <div className="text-2xl font-bold text-white">{securitySettings?.sessionTimeout || 30}m</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Authentication Settings */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Authentication & Access
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Session Timeout (minutes)
                          </label>
                          <Input
                            type="number"
                            value={settings.sessionTimeout}
                            onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <p className="text-xs text-gray-400 mt-1">Auto-logout after inactivity</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Password Min Length
                          </label>
                          <Input
                            type="number"
                            value={settings.passwordMinLength}
                            onChange={(e) => setSettings({ ...settings, passwordMinLength: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <p className="text-xs text-gray-400 mt-1">Minimum {settings.passwordMinLength} characters</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.requireMFA}
                            onChange={(e) => setSettings({ ...settings, requireMFA: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium">🔐 Require MFA</p>
                            <p className="text-gray-400 text-xs">Force all users to enable 2FA</p>
                          </div>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.allowPublicRegistration}
                            onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium">🚪 Public Registration</p>
                            <p className="text-gray-400 text-xs">Allow users to self-register</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Button
                        onClick={handleUpdateSecuritySettings}
                        disabled={savingSettings}
                        className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-transform"
                      >
                        {savingSettings ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Security Settings
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleForceLogoutAll}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform"
                      >
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Force Logout All Users
                      </Button>
                    </div>

                    {/* Password Requirements Info */}
                    <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                      <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Password Requirements
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                          <p>✅ Minimum length: {settings.passwordMinLength} characters</p>
                          <p>✅ Must include uppercase letters</p>
                          <p>✅ Must include numbers</p>
                        </div>
                        <div>
                          <p>✅ Must include special characters</p>
                          <p>✅ Cannot reuse last 5 passwords</p>
                          <p>✅ Expires after 90 days</p>
                        </div>
                      </div>
                    </div>

                    {/* Security Warning */}
                    <div className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-yellow-400 font-semibold">Security Best Practices</p>
                          <ul className="text-sm text-gray-300 mt-2 space-y-1">
                            <li>• Enable MFA for all admin accounts</li>
                            <li>• Set session timeout to 30 minutes or less</li>
                            <li>• Review active sessions regularly</li>
                            <li>• Disable public registration in production</li>
                            <li>• Use "Force Logout All" only in emergencies</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-500" />
                      Notification Management
                    </h2>
                    
                    {/* Notification Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-500/20 rounded-lg">
                            <Mail className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Email Enabled</div>
                            <div className="text-2xl font-bold text-white">
                              {settings.emailNotifications ? 'ON' : 'OFF'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-orange-600/10 border border-orange-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-orange-500/20 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-orange-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Overdue Found</div>
                            <div className="text-2xl font-bold text-white">{notificationStats.overdue}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-500/20 rounded-lg">
                            <CheckCheck className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Monitoring Active</div>
                            <div className="text-2xl font-bold text-white">24/7</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <Button
                        onClick={handleCheckOverdueProjects}
                        disabled={checkingProjects}
                        className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white transition-transform"
                      >
                        {checkingProjects ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Check Overdue
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleSendTestEmail}
                        disabled={sendingTestEmail}
                        className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-transform"
                      >
                        {sendingTestEmail ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Test Email
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleSave}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 active:scale-95 transition-transform"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>

                    {/* Notification Settings */}
                    <div className="space-y-4 mb-6">
                      <h3 className="text-white font-semibold">Notification Preferences</h3>
                      
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">📧 Email Notifications</p>
                          <p className="text-gray-400 text-sm">Send all notifications via email to users</p>
                        </div>
                        <Mail className="w-5 h-5 text-gray-400" />
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.projectUpdates}
                          onChange={(e) => setSettings({ ...settings, projectUpdates: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">📋 Project Overdue Alerts</p>
                          <p className="text-gray-400 text-sm">Automatically notify users when projects are overdue</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.taskReminders}
                          onChange={(e) => setSettings({ ...settings, taskReminders: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">⏰ Project Due Soon Reminders</p>
                          <p className="text-gray-400 text-sm">Send reminders 3 days before project deadlines</p>
                        </div>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.eventAlerts}
                          onChange={(e) => setSettings({ ...settings, eventAlerts: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">✅ Project Completion Notifications</p>
                          <p className="text-gray-400 text-sm">Notify team when projects are completed</p>
                        </div>
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </label>
                    </div>

                    {/* Info Panel */}
                    <div className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                      <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        How It Works
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li>• <strong>Check Overdue</strong> - Scans all projects and sends notifications for overdue ones</li>
                        <li>• <strong>Test Email</strong> - Sends a test email to your account to verify the system is working</li>
                        <li>• <strong>Automatic Monitoring</strong> - System automatically checks projects daily at 8 AM</li>
                        <li>• <strong>Email Notifications</strong> - Users receive emails when notifications are sent</li>
                        <li>• <strong>Resend Feature</strong> - Individual notifications can be resent from notification center</li>
                        <li>• <strong>Due Soon Alerts</strong> - Projects due within 3 days get reminder notifications</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Backup */}
                <TabsContent value="backup" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Database className="w-5 h-5 text-emerald-500" />
                      Backup & Restore
                    </h2>
                    
                    {/* Backup Settings */}
                    <div className="space-y-6 mb-8">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup}
                          onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20"
                        />
                        <div>
                          <p className="text-white font-medium">Enable Automatic Backups</p>
                          <p className="text-gray-400 text-sm">Automatically backup data on schedule</p>
                        </div>
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Backup Frequency
                          </label>
                          <select
                            value={settings.backupFrequency}
                            onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-md text-white"
                            disabled={!settings.autoBackup}
                          >
                            <option value="hourly" className="bg-gray-800 text-white">Hourly</option>
                            <option value="daily" className="bg-gray-800 text-white">Daily</option>
                            <option value="weekly" className="bg-gray-800 text-white">Weekly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Retention Period (days)
                          </label>
                          <Input
                            type="number"
                            value={settings.retentionDays}
                            onChange={(e) => setSettings({ ...settings, retentionDays: e.target.value })}
                            className="bg-white/10 border-white/20 text-white"
                            disabled={!settings.autoBackup}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Manual Backup Actions */}
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                        <Button 
                          onClick={handleCreateBackup}
                          disabled={backupInProgress}
                          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-transform"
                        >
                          {backupInProgress ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Create Backup
                            </>
                          )}
                        </Button>
                        
                        <input
                          id="import-backup-file"
                          type="file"
                          accept=".json"
                          onChange={handleImportBackup}
                          disabled={importInProgress}
                          className="hidden"
                        />
                        <label 
                          htmlFor="import-backup-file"
                          className="inline-flex w-full"
                        >
                          <div className={`flex items-center justify-center w-full px-4 py-2 rounded-lg font-medium transition-all ${
                            importInProgress 
                              ? 'bg-emerald-700 cursor-not-allowed opacity-50' 
                              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer'
                          } text-white`}>
                            {importInProgress ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Backup
                              </>
                            )}
                          </div>
                        </label>
                        
                        <Button 
                          onClick={handleUpdateBackupSchedule}
                          variant="outline" 
                          className="border-white/20 text-white hover:bg-white/10 active:scale-95 transition-transform"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Schedule
                        </Button>
                      </div>
                      
                      {/* Maintenance Zone */}
                      <div className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg space-y-4 mb-4">
                        <div>
                          <h4 className="text-white font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            Maintenance & Cleanup
                          </h4>
                          <p className="text-gray-400 text-sm mt-1">Fix data issues and maintain database health</p>
                        </div>

                        {/* Scan Button */}
                        <div>
                          <Button 
                            onClick={handleScanDuplicates}
                            disabled={scanningDuplicates}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full active:scale-95 transition-transform"
                          >
                            {scanningDuplicates ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Scanning Database...
                              </>
                            ) : (
                              <>
                                <Database className="w-4 h-4 mr-2" />
                                Scan for Duplicates
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Duplicate Stats */}
                        {duplicateStats.total > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg text-center">
                              <div className="text-2xl font-bold text-red-400">{duplicateStats.total}</div>
                              <div className="text-xs text-gray-400">Total</div>
                            </div>
                            <div className="p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-center">
                              <div className="text-2xl font-bold text-yellow-400">{duplicateStats.users}</div>
                              <div className="text-xs text-gray-400">Users</div>
                            </div>
                            <div className="p-3 bg-orange-600/20 border border-orange-500/30 rounded-lg text-center">
                              <div className="text-2xl font-bold text-orange-400">{duplicateStats.departments}</div>
                              <div className="text-xs text-gray-400">Departments</div>
                            </div>
                            <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-lg text-center">
                              <div className="text-2xl font-bold text-purple-400">{duplicateStats.userLevels}</div>
                              <div className="text-xs text-gray-400">User Levels</div>
                            </div>
                          </div>
                        )}

                        {/* Remove Buttons */}
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            onClick={handleRemoveDuplicateUsers}
                            disabled={removingDuplicates || duplicateStats.users === 0}
                            variant="outline" 
                            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 active:scale-95 transition-transform disabled:opacity-50"
                          >
                            {removingDuplicates ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Cleaning...
                              </>
                            ) : (
                              <>
                                <CheckCheck className="w-4 h-4 mr-2" />
                                Remove Duplicate Users
                                {duplicateStats.users > 0 && ` (${duplicateStats.users})`}
                              </>
                            )}
                          </Button>

                          <Button 
                            onClick={handleRemoveDuplicateDepartments}
                            disabled={removingDeptDuplicates || duplicateStats.departments === 0}
                            variant="outline" 
                            className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20 active:scale-95 transition-transform disabled:opacity-50"
                          >
                            {removingDeptDuplicates ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Cleaning...
                              </>
                            ) : (
                              <>
                                <Building className="w-4 h-4 mr-2" />
                                Remove Duplicate Departments
                                {duplicateStats.departments > 0 && ` (${duplicateStats.departments})`}
                              </>
                            )}
                          </Button>

                          <Button 
                            onClick={handleRemoveDuplicateUserLevels}
                            disabled={removingLevelDuplicates || duplicateStats.userLevels === 0}
                            variant="outline" 
                            className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 active:scale-95 transition-transform disabled:opacity-50"
                          >
                            {removingLevelDuplicates ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Cleaning...
                              </>
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-2" />
                                Remove Duplicate User Levels
                                {duplicateStats.userLevels > 0 && ` (${duplicateStats.userLevels})`}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Danger Zone */}
                      <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg space-y-3">
                        <div>
                          <h4 className="text-white font-semibold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            Danger Zone
                          </h4>
                          <p className="text-gray-400 text-sm mt-1">Destructive operations (archives created first)</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button 
                            onClick={() => setShowClearModal(true)}
                            variant="outline" 
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Clear Users
                          </Button>
                          <Button 
                            onClick={() => setShowClearDataModal(true)}
                            variant="outline" 
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform"
                          >
                            <Database className="w-4 h-4 mr-2" />
                            Clear All Data
                          </Button>
                          <Button 
                            onClick={() => setShowClearMessagesModal(true)}
                            variant="outline" 
                            className="border-red-500/50 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Clear All Messages
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Backup History */}
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Backup History
                      </h3>
                      {backups && backups.length > 0 ? (
                        backups.map((backup: any) => (
                          <div 
                            key={backup._id}
                            className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <HardDrive className={`w-5 h-5 ${
                                  backup.type === 'manual' ? 'text-blue-400' :
                                  backup.type === 'archive' ? 'text-yellow-400' :
                                  'text-emerald-400'
                                }`} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-medium">
                                      {backup.type === 'manual' ? '📦 Manual Backup' :
                                       backup.type === 'archive' ? '📚 Archive' :
                                       '🤖 Automatic Backup'}
                                    </p>
                                    <Badge className={`${
                                      backup.status === 'completed' ? 'bg-emerald-600' :
                                      backup.status === 'failed' ? 'bg-red-600' :
                                      'bg-yellow-600'
                                    } text-white text-xs`}>
                                      {backup.status}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-400 text-sm">
                                    {new Date(backup.timestamp).toLocaleString()}
                                  </p>
                                  {backup.description && (
                                    <p className="text-gray-500 text-xs mt-1">{backup.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>{backup.recordCount} records</span>
                                <span>•</span>
                                <span>{Object.keys(backup.tables || {}).length} tables</span>
                                <span>•</span>
                                <span>By {backup.creatorName}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadBackup(backup._id)}
                                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-transform"
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  Export
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBackupId(backup._id);
                                    setShowRestoreModal(true);
                                  }}
                                  className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-transform"
                                >
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Restore
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteBackup(backup._id)}
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-white/5 rounded-lg">
                          <Database className="w-12 h-12 mx-auto text-gray-600 mb-3" />
                          <p className="text-gray-400">No backups yet</p>
                          <p className="text-gray-500 text-sm">Create your first backup to get started</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Performance Optimization */}
                <TabsContent value="performance" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      Performance Optimization
                    </h2>
                    
                    {/* Statistics */}
                    {logStats && (
                      <div className="space-y-6 mb-6">
                        {/* Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">Activity Logs</p>
                            <p className="text-2xl font-bold text-white">{logStats.userActivityLogs.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{logStats.userActivityLogs.olderThan30Days.toLocaleString()} older than 30 days</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">User Sessions</p>
                            <p className="text-2xl font-bold text-white">{logStats.userSessions.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{logStats.userSessions.active} active, {logStats.userSessions.inactive} inactive</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">Project Activities</p>
                            <p className="text-2xl font-bold text-white">{logStats.projectActivities.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{logStats.projectActivities.olderThan60Days.toLocaleString()} older than 60 days</p>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <p className="text-gray-400 text-sm mb-1">Search History</p>
                            <p className="text-2xl font-bold text-white">{logStats.searchHistory.total.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{logStats.searchHistory.olderThan60Days.toLocaleString()} older than 60 days</p>
                          </div>
                        </div>

                        {/* Recommendations */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            Recommendations
                          </h3>
                          {logStats.recommendations.map((rec: any, idx: number) => (
                            <div 
                              key={idx}
                              className={`p-4 rounded-lg border ${
                                rec.severity === 'high' ? 'bg-red-600/10 border-red-500/30' :
                                rec.severity === 'medium' ? 'bg-yellow-600/10 border-yellow-500/30' :
                                'bg-green-600/10 border-green-500/30'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {rec.severity === 'high' && <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                                {rec.severity === 'medium' && <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />}
                                {rec.severity === 'low' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
                                <div className="flex-1">
                                  <p className="text-white font-medium">{rec.message}</p>
                                  <p className="text-gray-400 text-sm mt-1">Action: {rec.action}</p>
                                  <p className="text-gray-500 text-xs mt-1">Impact: {rec.impact}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cleanup Actions */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white mb-4">Cleanup Actions</h3>
                      
                      {/* One-Click Optimization */}
                      <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1 flex items-center gap-2">
                              <CheckCheck className="w-5 h-5 text-emerald-400" />
                              One-Click System Optimization
                            </h4>
                            <p className="text-gray-300 text-sm mb-2">
                              Automatically clean up all old logs and optimize database performance
                            </p>
                            <ul className="text-xs text-gray-400 space-y-1">
                              <li>• Removes activity logs older than 30 days</li>
                              <li>• Removes search history older than 60 days</li>
                              <li>• Removes project activities older than 90 days</li>
                              <li>• Removes inactive sessions older than 7 days</li>
                            </ul>
                          </div>
                          <Button
                            onClick={async () => {
                              if (!confirm('This will clean up old logs to improve performance. Continue?')) return;
                              setOptimizing(true);
                              setCleanupResult(null);
                              try {
                                const result = await optimizeSystemMut({ dryRun: false });
                                setCleanupResult(result);
                                alert(`✅ Optimization Complete!\n\nDeleted ${result.results.totalDeleted} records.\n\nActivity Logs: ${result.results.activityLogs.deleted}\nSearch History: ${result.results.searchHistory.deleted}\nProject Activities: ${result.results.projectActivities.deleted}\nSessions: ${result.results.inactiveSessions.deleted}`);
                              } catch (error: any) {
                                alert(`❌ Optimization failed: ${error.message}`);
                              } finally {
                                setOptimizing(false);
                              }
                            }}
                            disabled={optimizing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
                          >
                            {optimizing ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Optimizing...
                              </>
                            ) : (
                              <>
                                <CheckCheck className="w-4 h-4 mr-2" />
                                Optimize Now
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Individual Cleanup Options */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Activity Logs</h4>
                          <p className="text-gray-400 text-sm mb-3">Clean up old user activity logs (keep 30 days)</p>
                          <Button
                            onClick={async () => {
                              setOptimizing(true);
                              try {
                                const result = await cleanupActivityLogsMut({ daysToKeep: 30, dryRun: false });
                                alert(`Deleted ${result.deleted} activity logs`);
                              } catch (error: any) {
                                alert(`Failed: ${error.message}`);
                              } finally {
                                setOptimizing(false);
                              }
                            }}
                            disabled={optimizing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Activity Logs
                          </Button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Search History</h4>
                          <p className="text-gray-400 text-sm mb-3">Clean up old search history (keep 60 days)</p>
                          <Button
                            onClick={async () => {
                              setOptimizing(true);
                              try {
                                const result = await cleanupSearchHistoryMut({ daysToKeep: 60, dryRun: false });
                                alert(`Deleted ${result.deleted} search records`);
                              } catch (error: any) {
                                alert(`Failed: ${error.message}`);
                              } finally {
                                setOptimizing(false);
                              }
                            }}
                            disabled={optimizing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Search History
                          </Button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Project Activities</h4>
                          <p className="text-gray-400 text-sm mb-3">Clean up old project activities (keep 90 days)</p>
                          <Button
                            onClick={async () => {
                              setOptimizing(true);
                              try {
                                const result = await cleanupProjectActivitiesMut({ daysToKeep: 90, dryRun: false });
                                alert(`Deleted ${result.deleted} project activities`);
                              } catch (error: any) {
                                alert(`Failed: ${error.message}`);
                              } finally {
                                setOptimizing(false);
                              }
                            }}
                            disabled={optimizing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Project Activities
                          </Button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Inactive Sessions</h4>
                          <p className="text-gray-400 text-sm mb-3">Clean up old inactive sessions (keep 7 days)</p>
                          <Button
                            onClick={async () => {
                              setOptimizing(true);
                              try {
                                const result = await cleanupInactiveSessionsMut({ daysToKeep: 7, dryRun: false });
                                alert(`Deleted ${result.deleted} inactive sessions`);
                              } catch (error: any) {
                                alert(`Failed: ${error.message}`);
                              } finally {
                                setOptimizing(false);
                              }
                            }}
                            disabled={optimizing}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Inactive Sessions
                          </Button>
                        </div>
                      </div>

                      {/* Last Cleanup Result */}
                      {cleanupResult && (
                        <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4">
                          <h4 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Last Optimization Result
                          </h4>
                          <p className="text-gray-300 text-sm">{cleanupResult.message}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            <div className="bg-white/5 rounded p-2">
                              <p className="text-xs text-gray-400">Activity Logs</p>
                              <p className="text-white font-semibold">{cleanupResult.results.activityLogs.deleted}</p>
                            </div>
                            <div className="bg-white/5 rounded p-2">
                              <p className="text-xs text-gray-400">Search History</p>
                              <p className="text-white font-semibold">{cleanupResult.results.searchHistory.deleted}</p>
                            </div>
                            <div className="bg-white/5 rounded p-2">
                              <p className="text-xs text-gray-400">Project Activities</p>
                              <p className="text-white font-semibold">{cleanupResult.results.projectActivities.deleted}</p>
                            </div>
                            <div className="bg-white/5 rounded p-2">
                              <p className="text-xs text-gray-400">Sessions</p>
                              <p className="text-white font-semibold">{cleanupResult.results.inactiveSessions.deleted}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* System Info */}
                <TabsContent value="system" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Info className="w-5 h-5 text-emerald-500" />
                      System Information
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-gray-400 text-sm">Application Version</p>
                          <p className="text-white font-medium">v2.0.0</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Database</p>
                          <p className="text-white font-medium">Convex</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-gray-400 text-sm">Total Users</p>
                          <p className="text-white font-medium">{userLevels?.length || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Total Departments</p>
                          <p className="text-white font-medium">{departments?.length || 0}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-gray-400 text-sm">Server Status</p>
                          <Badge className="bg-emerald-600 text-white mt-1">
                            <Activity className="w-3 h-3 mr-1" />
                            Online
                          </Badge>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Maintenance Mode</p>
                          <Badge className={`${settings.maintenanceMode ? "bg-red-600" : "bg-gray-600"} text-white mt-1`}>
                            {settings.maintenanceMode ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.maintenanceMode}
                            onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20"
                          />
                          <div>
                            <p className="text-yellow-400 font-medium">Enable Maintenance Mode</p>
                            <p className="text-gray-300 text-sm">Temporarily disable access for all users except admins</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Restore Backup Modal */}
        {showRestoreModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                Restore Backup
              </h3>
              <p className="text-gray-400 mb-6">
                Choose how to restore this backup. You can either merge with existing data or clear everything first.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                  <p className="text-blue-400 font-medium text-sm">📋 Merge Mode</p>
                  <p className="text-gray-400 text-xs mt-1">Adds backup data to existing data (may create duplicates)</p>
                </div>
                <div className="p-3 bg-red-600/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 font-medium text-sm">🗑️ Replace Mode</p>
                  <p className="text-gray-400 text-xs mt-1">Clears all data first, then restores (current data will be archived)</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => handleRestoreBackup(selectedBackupId, false)}
                  disabled={restoreInProgress}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-transform"
                >
                  {restoreInProgress ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Restoring...</>
                  ) : (
                    <>Merge</>
                  )}
                </Button>
                <Button
                  onClick={() => handleRestoreBackup(selectedBackupId, true)}
                  disabled={restoreInProgress}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-transform"
                >
                  {restoreInProgress ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Restoring...</>
                  ) : (
                    <>Replace</>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedBackupId(null);
                  }}
                  variant="outline"
                  disabled={restoreInProgress}
                  className="border-white/20 text-white hover:bg-white/10 active:scale-95 transition-transform"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Clear Users Modal */}
        {showClearModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Clear Users
              </h3>
              <p className="text-gray-400 mb-6">
                This will clear user data from the system. <strong className="text-white">All data will be archived first</strong> so you can restore it later if needed.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 font-medium text-sm">⚠️ Warning</p>
                  <p className="text-gray-400 text-xs mt-1">This action will create an archive backup before clearing users</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => handleClearUsers(true)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white transition-transform"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Keep Admins
                </Button>
                <Button
                  onClick={() => handleClearUsers(false)}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-transform"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  onClick={() => setShowClearModal(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 active:scale-95 transition-transform"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Clear All Data Modal */}
        {showClearDataModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-red-500" />
                Clear All Data
              </h3>
              <p className="text-gray-400 mb-6">
                This will clear <strong className="text-red-400">projects, milestones, events, tasks, and documents</strong>. <strong className="text-emerald-400">Users and departments are preserved.</strong> <strong className="text-white">All data will be archived first</strong>.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-red-600/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 font-medium text-sm">🚨 Will Clear</p>
                  <p className="text-gray-300 text-xs mt-1">Projects, Milestones, Events, Tasks, Event Tasks, Messages, Documents</p>
                </div>
                <div className="p-3 bg-emerald-600/20 border border-emerald-500/50 rounded-lg">
                  <p className="text-emerald-400 font-medium text-sm">✅ Will Keep</p>
                  <p className="text-gray-300 text-xs mt-1">Users, Departments, User Levels, System Settings</p>
                </div>
                <div className="p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 font-medium text-sm">✅ Archive Created</p>
                  <p className="text-gray-400 text-xs mt-1">An archive backup will be created before clearing</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleClearAllData}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-transform"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Everything
                </Button>
                <Button
                  onClick={() => setShowClearDataModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 active:scale-95 transition-transform"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Clear All Messages Modal */}
        {showClearMessagesModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-red-500" />
                Clear All Messages
              </h3>
              <p className="text-gray-400 mb-6">
                This will clear <strong className="text-red-400">ALL messages from the system</strong>. <strong className="text-white">All messages will be archived first</strong>.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="p-3 bg-red-600/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 font-medium text-sm">🚨 Will Clear</p>
                  <p className="text-gray-300 text-xs mt-1">All Messages (Direct Messages, Group Messages)</p>
                </div>
                <div className="p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 font-medium text-sm">✅ Archive Created</p>
                  <p className="text-gray-400 text-xs mt-1">An archive backup will be created before clearing</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleClearAllMessages}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-transform"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Messages
                </Button>
                <Button
                  onClick={() => setShowClearMessagesModal(false)}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 active:scale-95 transition-transform"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
