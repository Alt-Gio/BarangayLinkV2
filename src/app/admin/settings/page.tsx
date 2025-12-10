"use client";

import { useState, useEffect } from 'react';
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
  MapPin,
  Map,
  X,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";
import RippleLoader from "@/components/ui/RippleLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminGuard } from "@/components/admin/AdminGuard";
import MapCoordinatePicker from "@/components/admin/MapCoordinatePicker";

export const dynamic = "force-dynamic";

export default function SystemSettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const { currentUser, isOnline } = useOfflineData();
  const departments = useQuery(api.departments.getAllDepartmentsWithStats, isLoaded && user ? {} : "skip");
  const userLevels = useQuery(api.departments.getAllUserLevels, isLoaded && user ? {} : "skip");
  const backups = useQuery(api.backup.getAllBackups, isLoaded && user ? {} : "skip");
  const backupSchedule = useQuery(api.backup.getBackupSchedule, isLoaded && user ? {} : "skip");
  const securitySettings = useQuery(api.securitySettings.getSecuritySettings, isLoaded && user ? {} : "skip");
  const activeSessions = useQuery(api.securitySettings.getActiveSessionsCount, isLoaded && user ? {} : "skip");
  const siteSettings = useQuery(api.siteSettings.getAllSettings, isLoaded && user ? {} : "skip");
  
  const updateSiteSettingsMut = useMutation(api.siteSettings.updateMultipleSettings);
  const initializeDefaultSettings = useMutation(api.siteSettings.initializeDefaultSettings);
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
  
  const checkOverdueAction = useAction(api.notificationSystem.checkOverdueProjects);
  const resendNotificationMut = useMutation(api.notificationSystem.resendNotification);
  const sendTestEmailAction = useAction(api.notificationSystem.sendTestEmail);
  const updateSecurityMut = useMutation(api.securitySettings.updateSecuritySettings);
  const forceLogoutAllMut = useMutation(api.securitySettings.forceLogoutAllUsers);
  const createDepartmentMut = useMutation(api.departments.createDepartment);
  const updateDepartmentMut = useMutation(api.departments.updateDepartment);
  const deleteDepartmentMut = useMutation(api.departments.deleteDepartment);
  const updateBackupScheduleMut = useMutation(api.backup.updateBackupSchedule);
  
  const logStats = useQuery(api.performanceOptimization.getLogStatistics, isLoaded && user ? {} : "skip");
  const optimizeSystemMut = useMutation(api.performanceOptimization.optimizeSystem);
  const cleanupActivityLogsMut = useMutation(api.performanceOptimization.cleanupOldActivityLogs);
  const cleanupSearchHistoryMut = useMutation(api.performanceOptimization.cleanupOldSearchHistory);
  const cleanupProjectActivitiesMut = useMutation(api.performanceOptimization.cleanupOldProjectActivities);
  const cleanupInactiveSessionsMut = useMutation(api.performanceOptimization.cleanupInactiveSessions);

  const landmarks = useQuery(api.landmarks.getAllLandmarks, isLoaded && user ? {} : "skip");
  const barangayHallCoords = useQuery(api.landmarks.getBarangayHallCoordinates, isLoaded && user ? {} : "skip");
  const projectsWithoutCoords = useQuery(api.landmarks.getProjectsWithoutCoordinates, isLoaded && user ? {} : "skip");
  const eventsWithoutCoords = useQuery(api.landmarks.getEventsWithoutCoordinates, isLoaded && user ? {} : "skip");
  const updateBarangayHallMut = useMutation(api.landmarks.updateBarangayHallCoordinates);
  const createLandmarkMut = useMutation(api.landmarks.createLandmark);
  const updateLandmarkMut = useMutation(api.landmarks.updateLandmark);
  const deleteLandmarkMut = useMutation(api.landmarks.deleteLandmark);
  const updateProjectCoordsMut = useMutation(api.landmarks.updateProjectCoordinates);
  const updateEventCoordsMut = useMutation(api.landmarks.updateEventCoordinates);
  const toggleProjectVisibility = useMutation(api.mapManagement.toggleProjectVisibility);
  const toggleEventVisibility = useMutation(api.mapManagement.toggleEventVisibility);

  const [settings, setSettings] = useState({
    siteName: "BarangayLink",
    siteDescription: "Barangay Project Management System",
    contactEmail: "admin@barangaylink.gov",
    timezone: "Asia/Manila",
    fiscalYear: "2025-2026",
    
    mission: "To build a thriving, inclusive community through transparent governance, innovative project management, and active citizen participation. We leverage technology to keep our residents informed and engaged in every step of our community's development.",
    vision: "A progressive community committed to transparency, collaboration, and sustainable development",
    copyright: "© 2024 Barangay Bitano. All rights reserved.",
    version: "v2.0.0",
    
    sessionTimeout: "30",
    passwordMinLength: "8",
    requireMFA: false,
    allowPublicRegistration: false,
    
    emailNotifications: true,
    projectUpdates: true,
    taskReminders: true,
    eventAlerts: true,
    
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

  const [barangayHallLat, setBarangayHallLat] = useState<number>(13.1469299);
  const [barangayHallLng, setBarangayHallLng] = useState<number>(123.7494046);
  const [showAddLandmarkModal, setShowAddLandmarkModal] = useState(false);
  const [showEditLandmarkModal, setShowEditLandmarkModal] = useState(false);
  const [showDeleteLandmarkModal, setShowDeleteLandmarkModal] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const [showProjectsListModal, setShowProjectsListModal] = useState(false);
  const [showEventsListModal, setShowEventsListModal] = useState(false);
  const [selectedProjectForMap, setSelectedProjectForMap] = useState<any>(null);
  const [selectedEventForMap, setSelectedEventForMap] = useState<any>(null);
  const [landmarkForm, setLandmarkForm] = useState({
    name: "",
    icon: "🏛️",
    color: "#3b82f6",
    latitude: 13.1466871,
    longitude: 123.7480647,
    googleMapsUrl: "",
    description: "",
  });
  const [savingLandmark, setSavingLandmark] = useState(false);
  const [updatingCoords, setUpdatingCoords] = useState(false);

  useEffect(() => {
    if (barangayHallCoords) {
      setBarangayHallLat(barangayHallCoords.latitude);
      setBarangayHallLng(barangayHallCoords.longitude);
    }
  }, [barangayHallCoords]);

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
      const backup = backups?.find((b: any) => b._id === backupId);
      if (!backup || !backup.dataJson) {
        alert('Backup not found');
        return;
      }
      
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
    
    const confirmImport = confirm(
      '📥 IMPORT BACKUP\n\n' +
      'Ready to import: ' + file.name + '\n\n' +
      'Click OK to continue, Cancel to abort.'
    );
    if (!confirmImport) {
      event.target.value = '';
      return;
    }
    
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

  const handleUpdateBarangayHall = async () => {
    if (updatingCoords) return;
    setUpdatingCoords(true);
    try {
      await updateBarangayHallMut({
        latitude: barangayHallLat,
        longitude: barangayHallLng,
      });
      alert('✅ Barangay Hall coordinates updated successfully!');
    } catch (error: any) {
      alert(`❌ Failed to update: ${error.message}`);
    } finally {
      setUpdatingCoords(false);
    }
  };

  const handleAddLandmark = async () => {
    if (savingLandmark) return;
    if (!landmarkForm.name || !landmarkForm.googleMapsUrl) {
      alert("Name and Google Maps URL are required");
      return;
    }
    
    setSavingLandmark(true);
    try {
      await createLandmarkMut({
        name: landmarkForm.name,
        icon: landmarkForm.icon,
        color: landmarkForm.color,
        latitude: landmarkForm.latitude,
        longitude: landmarkForm.longitude,
        googleMapsUrl: landmarkForm.googleMapsUrl,
      });
      setShowAddLandmarkModal(false);
      setLandmarkForm({
        name: "",
        icon: "🏛️",
        color: "#3b82f6",
        latitude: 13.1466871,
        longitude: 123.7480647,
        googleMapsUrl: "",
        description: "",
      });
      alert('✅ Landmark added successfully!');
    } catch (error: any) {
      alert(`❌ Failed to add landmark: ${error.message}`);
    } finally {
      setSavingLandmark(false);
    }
  };

  const handleEditLandmark = async () => {
    if (savingLandmark || !selectedLandmark) return;
    
    setSavingLandmark(true);
    try {
      await updateLandmarkMut({
        id: selectedLandmark._id,
        name: landmarkForm.name,
        icon: landmarkForm.icon,
        color: landmarkForm.color,
        latitude: landmarkForm.latitude,
        longitude: landmarkForm.longitude,
        googleMapsUrl: landmarkForm.googleMapsUrl,
      });
      setShowEditLandmarkModal(false);
      setSelectedLandmark(null);
      alert('✅ Landmark updated successfully!');
    } catch (error: any) {
      alert(`❌ Failed to update landmark: ${error.message}`);
    } finally {
      setSavingLandmark(false);
    }
  };

  const handleDeleteLandmark = async () => {
    if (!selectedLandmark) return;
    
    try {
      await deleteLandmarkMut({ id: selectedLandmark._id });
      setShowDeleteLandmarkModal(false);
      setSelectedLandmark(null);
      alert('✅ Landmark deleted successfully!');
    } catch (error: any) {
      alert(`❌ Failed to delete landmark: ${error.message}`);
    }
  };

  const handleUpdateProjectCoords = async (projectId: any, lat: number, lng: number) => {
    try {
      await updateProjectCoordsMut({
        projectId,
        latitude: lat,
        longitude: lng,
      });
      alert('✅ Project coordinates updated!');
    } catch (error: any) {
      alert(`❌ Failed: ${error.message}`);
    }
  };

  const handleUpdateEventCoords = async (eventId: any, lat: number, lng: number) => {
    try {
      await updateEventCoordsMut({
        eventId,
        latitude: lat,
        longitude: lng,
      });
      alert('✅ Event coordinates updated!');
    } catch (error: any) {
      alert(`❌ Failed: ${error.message}`);
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateSiteSettingsMut({
        settings: [
          { key: "siteName", value: settings.siteName },
          { key: "mission", value: settings.mission },
          { key: "vision", value: settings.vision },
          { key: "copyright", value: settings.copyright },
          { key: "version", value: settings.version },
        ],
      });
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
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
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Mobile Header with Hamburger + Centered Title */}
            <div className="md:hidden bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  aria-label="Toggle Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-bold text-white absolute left-1/2 transform -translate-x-1/2">
                  System Settings
                </h1>
                <div className="w-10" /> {/* Spacer for centering */}
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                      <Settings className="w-6 h-6 md:w-8 md:h-8 text-emerald-500" />
                      System Settings
                    </h1>
                    <p className="text-sm md:text-base text-gray-400 mt-1">Configure and manage system preferences</p>
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
              <Tabs defaultValue="general" className="space-y-4 md:space-y-6">
                {/* Horizontal Scrollable Tabs - Works on Both Mobile & Desktop */}
                <style jsx>{`
                  .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div className="bg-white/10 rounded-lg border border-white/20 overflow-hidden">
                  <TabsList className="hide-scrollbar w-full flex overflow-x-auto p-1 gap-1" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
                    <TabsTrigger value="general" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <Globe className="w-4 h-4 mr-1.5 md:mr-2" />
                      General
                    </TabsTrigger>
                    <TabsTrigger value="departments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <Building className="w-4 h-4 mr-1.5 md:mr-2" />
                      Departments
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <Lock className="w-4 h-4 mr-1.5 md:mr-2" />
                      Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <Bell className="w-4 h-4 mr-1.5 md:mr-2" />
                      Notifications
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <Database className="w-4 h-4 mr-1.5 md:mr-2" />
                      Backup
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <Activity className="w-4 h-4 mr-1.5 md:mr-2" />
                      Performance
                    </TabsTrigger>
                    <TabsTrigger value="system" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <Info className="w-4 h-4 mr-1.5 md:mr-2" />
                      System Info
                    </TabsTrigger>
                    <TabsTrigger value="landmarks" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white whitespace-nowrap px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base shrink-0">
                      <MapPin className="w-4 h-4 mr-1.5 md:mr-2" />
                      Landmarks
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-500" />
                      General Settings
                    </h2>
                    <div className="space-y-4 md:space-y-6">
                      <div className="grid grid-cols-1 gap-4 md:gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Site Name
                          </label>
                          <Input
                            value={settings.siteName}
                            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                            className="bg-white/10 border-white/20 text-white h-12 text-base"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Contact Email
                          </label>
                          <Input
                            type="email"
                            value={settings.contactEmail}
                            onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                            className="bg-white/10 border-white/20 text-white h-12 text-base"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                          Site Description
                        </label>
                        <Textarea
                          value={settings.siteDescription}
                          onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                          className="bg-white/10 border-white/20 text-white text-base min-h-[100px]"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Timezone
                          </label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-md text-white text-base h-12"
                          >
                            <option value="Asia/Manila" className="bg-gray-800 text-white">Asia/Manila (GMT+8)</option>
                            <option value="Asia/Tokyo" className="bg-gray-800 text-white">Asia/Tokyo (GMT+9)</option>
                            <option value="UTC" className="bg-gray-800 text-white">UTC (GMT+0)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Fiscal Year
                          </label>
                          <Input
                            value={settings.fiscalYear}
                            onChange={(e) => setSettings({ ...settings, fiscalYear: e.target.value })}
                            className="bg-white/10 border-white/20 text-white h-12 text-base"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Site Content Settings */}
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Site Content
                    </h2>
                    <div className="space-y-4 md:space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                          Mission Statement
                        </label>
                        <Textarea
                          value={settings.mission}
                          onChange={(e) => setSettings({ ...settings, mission: e.target.value })}
                          className="bg-white/10 border-white/20 text-white text-base min-h-[120px]"
                          rows={4}
                          placeholder="Enter your organization's mission statement..."
                        />
                        <p className="text-xs text-gray-400 mt-2">Displayed on the About section of the landing page</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                          Vision Statement
                        </label>
                        <Textarea
                          value={settings.vision}
                          onChange={(e) => setSettings({ ...settings, vision: e.target.value })}
                          className="bg-white/10 border-white/20 text-white text-base min-h-[90px]"
                          rows={3}
                          placeholder="Enter your organization's vision..."
                        />
                        <p className="text-xs text-gray-400 mt-2">Displayed as a subtitle in the About section</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Copyright Text
                          </label>
                          <Input
                            value={settings.copyright}
                            onChange={(e) => setSettings({ ...settings, copyright: e.target.value })}
                            className="bg-white/10 border-white/20 text-white h-12 text-base"
                            placeholder="© 2024 Your Organization"
                          />
                          <p className="text-xs text-gray-400 mt-2">Displayed in the footer of all pages</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Application Version
                          </label>
                          <Input
                            value={settings.version}
                            onChange={(e) => setSettings({ ...settings, version: e.target.value })}
                            className="bg-white/10 border-white/20 text-white h-12 text-base"
                            placeholder="v2.0.0"
                          />
                          <p className="text-xs text-gray-400 mt-2">Shown in the sidebar</p>
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
                <TabsContent value="backup" className="space-y-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                      <Database className="w-5 h-5 text-emerald-500" />
                      Backup & Restore
                    </h2>
                    
                    {/* Backup Settings */}
                    <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                      <label className="flex items-start gap-3 cursor-pointer p-3 md:p-0">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup}
                          onChange={(e) => setSettings({ ...settings, autoBackup: e.target.checked })}
                          className="w-6 h-6 mt-0.5 rounded border-white/20 cursor-pointer"
                        />
                        <div>
                          <p className="text-white font-semibold text-base">Enable Automatic Backups</p>
                          <p className="text-gray-400 text-sm mt-1">Automatically backup data on schedule</p>
                        </div>
                      </label>
                      
                      <div className="grid grid-cols-1 gap-4 md:gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Backup Frequency
                          </label>
                          <select
                            value={settings.backupFrequency}
                            onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800 border border-white/20 rounded-md text-white text-base h-12"
                            disabled={!settings.autoBackup}
                          >
                            <option value="hourly" className="bg-gray-800 text-white">Hourly</option>
                            <option value="daily" className="bg-gray-800 text-white">Daily</option>
                            <option value="weekly" className="bg-gray-800 text-white">Weekly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2.5">
                            Retention Period (days)
                          </label>
                          <Input
                            type="number"
                            value={settings.retentionDays}
                            onChange={(e) => setSettings({ ...settings, retentionDays: e.target.value })}
                            className="bg-white/10 border-white/20 text-white h-12 text-base"
                            disabled={!settings.autoBackup}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Manual Backup Actions */}
                    <div className="space-y-3 mb-4 md:mb-6">
                      <div className="grid grid-cols-1 gap-3 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                        <Button 
                          onClick={handleCreateBackup}
                          disabled={backupInProgress}
                          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-transform h-12 text-base font-semibold"
                        >
                          {backupInProgress ? (
                            <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Download className="w-5 h-5 mr-2" />
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
                          <div className={`flex items-center justify-center w-full px-4 py-3 rounded-lg font-semibold transition-all h-12 text-base ${
                            importInProgress 
                              ? 'bg-emerald-700 cursor-not-allowed opacity-50' 
                              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 cursor-pointer'
                          } text-white`}>
                            {importInProgress ? (
                              <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Importing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 mr-2" />
                                Import Backup
                              </>
                            )}
                          </div>
                        </label>
                        
                        <Button 
                          onClick={handleUpdateBackupSchedule}
                          variant="outline" 
                          className="border-white/20 text-white hover:bg-white/10 active:scale-95 transition-transform h-12 text-base font-semibold"
                        >
                          <Save className="w-5 h-5 mr-2" />
                          Save Schedule
                        </Button>
                      </div>
                      
                      {/* Maintenance Zone */}
                      <div className="p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-lg space-y-4 mb-4">
                        <div>
                          <h4 className="text-white font-semibold flex items-center gap-2 text-base md:text-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                            Maintenance & Cleanup
                          </h4>
                          <p className="text-gray-400 text-sm mt-1.5">Fix data issues and maintain database health</p>
                        </div>

                        {/* Scan Button */}
                        <div>
                          <Button 
                            onClick={handleScanDuplicates}
                            disabled={scanningDuplicates}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full active:scale-95 transition-transform h-12 text-base font-semibold"
                          >
                            {scanningDuplicates ? (
                              <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Scanning Database...
                              </>
                            ) : (
                              <>
                                <Database className="w-5 h-5 mr-2" />
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
                      <h3 className="text-white font-semibold text-base md:text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Backup History
                      </h3>
                      {backups && backups.length > 0 ? (
                        backups.map((backup: any) => (
                          <div 
                            key={backup._id}
                            className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            {/* Header Section */}
                            <div className="flex items-start gap-3 mb-3">
                              <HardDrive className={`w-6 h-6 shrink-0 mt-0.5 ${
                                backup.type === 'manual' ? 'text-blue-400' :
                                backup.type === 'archive' ? 'text-yellow-400' :
                                'text-emerald-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <p className="text-white font-semibold text-base">
                                    {backup.type === 'manual' ? '📦 Manual Backup' :
                                     backup.type === 'archive' ? '📚 Archive' :
                                     '🤖 Automatic Backup'}
                                  </p>
                                  <Badge className={`${
                                    backup.status === 'completed' ? 'bg-emerald-600' :
                                    backup.status === 'failed' ? 'bg-red-600' :
                                    'bg-yellow-600'
                                  } text-white text-xs px-2 py-0.5`}>
                                    {backup.status}
                                  </Badge>
                                </div>
                                <p className="text-gray-400 text-sm mb-1">
                                  {new Date(backup.timestamp).toLocaleString()}
                                </p>
                                {backup.description && (
                                  <p className="text-gray-500 text-sm mt-1.5">{backup.description}</p>
                                )}
                              </div>
                            </div>
                            
                            {/* Stats Section */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400 mb-3 pl-9">
                              <span className="font-medium">{backup.recordCount} records</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="font-medium">{Object.keys(backup.tables || {}).length} tables</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-gray-500">By {backup.creatorName}</span>
                            </div>
                            
                            {/* Actions Section */}
                            <div className="flex flex-wrap gap-2 pl-0 sm:pl-9">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadBackup(backup._id)}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-transform h-9 flex-1 sm:flex-none"
                              >
                                <Download className="w-4 h-4 mr-1.5" />
                                Export
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBackupId(backup._id);
                                  setShowRestoreModal(true);
                                }}
                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-transform h-9 flex-1 sm:flex-none"
                              >
                                <RefreshCw className="w-4 h-4 mr-1.5" />
                                Restore
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteBackup(backup._id)}
                                className="border-red-500/30 text-red-400 hover:bg-red-500/20 active:scale-95 transition-transform h-9 w-9 p-0 sm:w-auto sm:px-3"
                              >
                                <Trash2 className="w-4 h-4 sm:mr-0" />
                              </Button>
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

                {/* Landmarks & Coordinates */}
                <TabsContent value="landmarks" className="space-y-4">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                      Landmarks & Coordinates Management
                    </h2>
                    
                    {/* Info Banner */}
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                      <p className="text-blue-400 text-sm">
                        <strong>ℹ️ Note:</strong> Manage custom landmarks and default coordinates for projects/events. Landmarks will appear on the community map with clickable markers showing coordinates and Google Maps links.
                      </p>
                    </div>

                    <div className="space-y-8">
                      {/* Barangay Hall Coordinates */}
                      <div className="border-b border-white/10 pb-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          🏛️ Barangay Hall (Default Location)
                        </h3>
                        <p className="text-gray-400 text-sm mb-4">
                          Projects and events without coordinates will default to this location.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Latitude
                            </label>
                            <Input
                              type="number"
                              step="0.0000001"
                              value={barangayHallLat}
                              onChange={(e) => setBarangayHallLat(parseFloat(e.target.value))}
                              placeholder="13.1469299"
                              className="bg-white/5 border-white/10 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Longitude
                            </label>
                            <Input
                              type="number"
                              step="0.0000001"
                              value={barangayHallLng}
                              onChange={(e) => setBarangayHallLng(parseFloat(e.target.value))}
                              placeholder="123.7494046"
                              className="bg-white/5 border-white/10 text-white"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={handleUpdateBarangayHall}
                          disabled={updatingCoords}
                          className="mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {updatingCoords ? (
                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                          ) : (
                            <><Save className="w-4 h-4 mr-2" />Update Barangay Hall Location</>
                          )}
                        </Button>
                      </div>

                      {/* Landmarks Management */}
                      <div className="border-b border-white/10 pb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                          <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                            <Map className="w-5 h-5" />
                            Custom Landmarks
                          </h3>
                          <Button 
                            onClick={() => setShowAddLandmarkModal(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto h-12 text-base font-semibold"
                          >
                            <MapPin className="w-5 h-5 mr-2" />
                            Add New Landmark
                          </Button>
                        </div>
                        
                        {/* Existing Landmarks */}
                        <div className="space-y-4">
                          {!landmarks || landmarks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No landmarks yet. Click "Add New Landmark" to create one.</p>
                            </div>
                          ) : (
                            landmarks.map((landmark: any) => (
                              <div key={landmark._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="text-2xl">{landmark.icon}</div>
                                    <div>
                                      <h4 className="text-white font-semibold">{landmark.name}</h4>
                                      <p className="text-gray-400 text-sm">
                                        {landmark.latitude.toFixed(6)}°N, {landmark.longitude.toFixed(6)}°E
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 w-full sm:w-auto">
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-white/20 text-white hover:bg-white/10 flex-1 sm:flex-none h-10"
                                      onClick={() => {
                                        setSelectedLandmark(landmark);
                                        setLandmarkForm({
                                          name: landmark.name,
                                          icon: landmark.icon,
                                          color: landmark.color,
                                          latitude: landmark.latitude,
                                          longitude: landmark.longitude,
                                          googleMapsUrl: landmark.googleMapsUrl,
                                          description: landmark.description || "",
                                        });
                                        setShowEditLandmarkModal(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                      Edit
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="border-red-500/50 text-red-400 hover:bg-red-600/20 h-10 px-3"
                                      onClick={() => {
                                        setSelectedLandmark(landmark);
                                        setShowDeleteLandmarkModal(true);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-400">Color:</span>
                                    <span className="ml-2 text-white" style={{ color: landmark.color }}>
                                      ● {landmark.color}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Icon:</span>
                                    <span className="ml-2 text-white">{landmark.icon}</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Coordinate Editing Tools */}
                      <div>
                        <h3 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          Bulk Coordinate Management
                        </h3>
                        <div className="space-y-3 md:space-y-4">
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h4 className="text-white font-semibold mb-2 text-base">Projects Without Coordinates</h4>
                            <p className="text-gray-400 text-sm mb-4">
                              Projects without coordinates will automatically use Barangay Hall location
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <Button 
                                variant="outline" 
                                className="border-white/20 text-white hover:bg-white/10 h-12 text-base font-semibold w-full sm:w-auto"
                                onClick={() => setShowProjectsListModal(true)}
                              >
                                <MapPin className="w-5 h-5 mr-2" />
                                View Projects List
                              </Button>
                              {projectsWithoutCoords && (
                                <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-500/30 text-sm px-3 py-1.5">
                                  {projectsWithoutCoords.length} Projects
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h4 className="text-white font-semibold mb-2 text-base">Events Without Coordinates</h4>
                            <p className="text-gray-400 text-sm mb-4">
                              Events without coordinates will automatically use Barangay Hall location
                            </p>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <Button 
                                variant="outline" 
                                className="border-white/20 text-white hover:bg-white/10 h-12 text-base font-semibold w-full sm:w-auto"
                                onClick={() => setShowEventsListModal(true)}
                              >
                                <MapPin className="w-5 h-5 mr-2" />
                                View Events List
                              </Button>
                              {eventsWithoutCoords && (
                                <Badge variant="secondary" className="bg-orange-600/20 text-orange-400 border-orange-500/30 text-sm px-3 py-1.5">
                                  {eventsWithoutCoords.length} Events
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
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

        {/* Add Landmark Modal */}
        {showAddLandmarkModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-500" />
                Add New Landmark
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <Input
                    value={landmarkForm.name}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, name: e.target.value })}
                    placeholder="e.g., City Hall"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                  <select
                    value={landmarkForm.icon}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, icon: e.target.value })}
                    className="w-full px-3 py-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/50 rounded-lg text-white text-2xl font-semibold shadow-lg hover:border-emerald-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                  >
                    <option value="🏛️">🏛️ Government Building</option>
                    <option value="🏫">🏫 School</option>
                    <option value="🏥">🏥 Hospital</option>
                    <option value="🏪">🏪 Store</option>
                    <option value="🏬">🏬 Mall</option>
                    <option value="🏭">🏭 Factory</option>
                    <option value="⛪">⛪ Church</option>
                    <option value="🕌">🕌 Mosque</option>
                    <option value="🏟️">🏟️ Stadium</option>
                    <option value="🏞️">🏞️ Park</option>
                    <option value="🌳">🌳 Tree/Nature</option>
                    <option value="🌊">🌊 Water</option>
                    <option value="🏖️">🏖️ Beach</option>
                    <option value="⛰️">⛰️ Mountain</option>
                    <option value="🚉">🚉 Train Station</option>
                    <option value="🚌">🚌 Bus Stop</option>
                    <option value="⛽">⛽ Gas Station</option>
                    <option value="🏨">🏨 Hotel</option>
                    <option value="🍽️">🍽️ Restaurant</option>
                    <option value="☕">☕ Cafe</option>
                    <option value="🏪">🏪 Convenience Store</option>
                    <option value="🏦">🏦 Bank</option>
                    <option value="📮">📮 Post Office</option>
                    <option value="📚">📚 Library</option>
                    <option value="⚽">⚽ Sports</option>
                    <option value="🎭">🎭 Theater</option>
                    <option value="🎪">🎪 Event Venue</option>
                    <option value="🏗️">🏗️ Construction</option>
                    <option value="🔔">🔔 Bell/Alert</option>
                    <option value="📍">📍 Location Pin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <Textarea
                    value={landmarkForm.description || ''}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, description: e.target.value })}
                    placeholder="Brief description of this landmark..."
                    rows={3}
                    className="bg-white/5 border-white/10 text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color (Hex)</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={landmarkForm.color}
                      onChange={(e) => setLandmarkForm({ ...landmarkForm, color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={landmarkForm.color}
                      onChange={(e) => setLandmarkForm({ ...landmarkForm, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                {/* Map Coordinate Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">📍 Select Location on Map</label>
                  <MapCoordinatePicker
                    latitude={landmarkForm.latitude}
                    longitude={landmarkForm.longitude}
                    onLocationSelect={(lat, lng) => {
                      setLandmarkForm({ ...landmarkForm, latitude: lat, longitude: lng });
                    }}
                    height="350px"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Google Maps URL</label>
                  <Input
                    value={landmarkForm.googleMapsUrl}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, googleMapsUrl: e.target.value })}
                    placeholder="https://www.google.com/maps/..."
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleAddLandmark}
                  disabled={savingLandmark}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {savingLandmark ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><MapPin className="w-4 h-4 mr-2" />Add Landmark</>}
                </Button>
                <Button
                  onClick={() => setShowAddLandmarkModal(false)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Landmark Modal */}
        {showEditLandmarkModal && selectedLandmark && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-500" />
                Edit Landmark
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <Input
                    value={landmarkForm.name}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                  <select
                    value={landmarkForm.icon}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, icon: e.target.value })}
                    className="w-full px-3 py-3 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border-2 border-emerald-500/50 rounded-lg text-white text-2xl font-semibold shadow-lg hover:border-emerald-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer"
                  >
                    <option value="🏛️">🏛️ Government Building</option>
                    <option value="🏫">🏫 School</option>
                    <option value="🏥">🏥 Hospital</option>
                    <option value="🏪">🏪 Store</option>
                    <option value="🏬">🏬 Mall</option>
                    <option value="🏭">🏭 Factory</option>
                    <option value="⛪">⛪ Church</option>
                    <option value="🕌">🕌 Mosque</option>
                    <option value="🏟️">🏟️ Stadium</option>
                    <option value="🏞️">🏞️ Park</option>
                    <option value="🌳">🌳 Tree/Nature</option>
                    <option value="🌊">🌊 Water</option>
                    <option value="🏖️">🏖️ Beach</option>
                    <option value="⛰️">⛰️ Mountain</option>
                    <option value="🚉">🚉 Train Station</option>
                    <option value="🚌">🚌 Bus Stop</option>
                    <option value="⛽">⛽ Gas Station</option>
                    <option value="🏨">🏨 Hotel</option>
                    <option value="🍽️">🍽️ Restaurant</option>
                    <option value="☕">☕ Cafe</option>
                    <option value="🏪">🏪 Convenience Store</option>
                    <option value="🏦">🏦 Bank</option>
                    <option value="📮">📮 Post Office</option>
                    <option value="📚">📚 Library</option>
                    <option value="⚽">⚽ Sports</option>
                    <option value="🎭">🎭 Theater</option>
                    <option value="🎪">🎪 Event Venue</option>
                    <option value="🏗️">🏗️ Construction</option>
                    <option value="🔔">🔔 Bell/Alert</option>
                    <option value="📍">📍 Location Pin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                  <Textarea
                    value={landmarkForm.description || ''}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, description: e.target.value })}
                    placeholder="Brief description of this landmark..."
                    rows={3}
                    className="bg-white/5 border-white/10 text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Color (Hex)</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={landmarkForm.color}
                      onChange={(e) => setLandmarkForm({ ...landmarkForm, color: e.target.value })}
                      className="w-16 h-10"
                    />
                    <Input
                      value={landmarkForm.color}
                      onChange={(e) => setLandmarkForm({ ...landmarkForm, color: e.target.value })}
                      className="flex-1 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                {/* Map Coordinate Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">📍 Select Location on Map</label>
                  <MapCoordinatePicker
                    latitude={landmarkForm.latitude}
                    longitude={landmarkForm.longitude}
                    onLocationSelect={(lat, lng) => {
                      setLandmarkForm({ ...landmarkForm, latitude: lat, longitude: lng });
                    }}
                    height="350px"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Google Maps URL</label>
                  <Input
                    value={landmarkForm.googleMapsUrl}
                    onChange={(e) => setLandmarkForm({ ...landmarkForm, googleMapsUrl: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={handleEditLandmark}
                  disabled={savingLandmark}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {savingLandmark ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Updating...</> : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                </Button>
                <Button
                  onClick={() => {
                    setShowEditLandmarkModal(false);
                    setSelectedLandmark(null);
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Landmark Modal */}
        {showDeleteLandmarkModal && selectedLandmark && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Delete Landmark
              </h3>
              <p className="text-gray-400 mb-6">
                Are you sure you want to delete <strong className="text-white">{selectedLandmark.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteLandmark}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteLandmarkModal(false);
                    setSelectedLandmark(null);
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Without Coordinates Modal */}
        {showProjectsListModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Projects Without Coordinates
                </h3>
                <Button
                  onClick={() => setShowProjectsListModal(false)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 h-10 w-10 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {!projectsWithoutCoords || projectsWithoutCoords.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>All projects have coordinates!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectsWithoutCoords.map((project: any) => (
                    <div key={project._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                        <h4 className="text-white font-semibold text-base">{project.title}</h4>
                        <span className={`text-xs px-2.5 py-1 rounded whitespace-nowrap ${project.isPublic ? 'bg-green-600/30 text-green-300' : 'bg-gray-600/30 text-gray-300'}`}>
                          {project.isPublic ? '👁️ Public' : '🔒 Private'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{project.description?.substring(0, 100)}...</p>
                      <Button
                        onClick={() => setSelectedProjectForMap(project)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
                      >
                        <MapPin className="w-5 h-5 mr-2" />
                        Set Location on Map
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Events Without Coordinates Modal */}
        {showEventsListModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Events Without Coordinates
                </h3>
                <Button
                  onClick={() => setShowEventsListModal(false)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 h-10 w-10 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {!eventsWithoutCoords || eventsWithoutCoords.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p>All events have coordinates!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {eventsWithoutCoords.map((event: any) => (
                    <div key={event._id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                        <h4 className="text-white font-semibold text-base">{event.title}</h4>
                        <span className={`text-xs px-2.5 py-1 rounded whitespace-nowrap ${event.isPublic ? 'bg-green-600/30 text-green-300' : 'bg-gray-600/30 text-gray-300'}`}>
                          {event.isPublic ? '👁️ Public' : '🔒 Private'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{event.description?.substring(0, 100)}...</p>
                      <Button
                        onClick={() => setSelectedEventForMap(event)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-semibold"
                      >
                        <MapPin className="w-5 h-5 mr-2" />
                        Set Location on Map
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Project Map Picker Modal */}
        {selectedProjectForMap && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  Set Project Location: {selectedProjectForMap.title}
                </h3>
                <Button
                  onClick={() => setSelectedProjectForMap(null)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-4 flex items-center gap-3 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Visibility:
                </label>
                <button
                  onClick={async () => {
                    await toggleProjectVisibility({ 
                      projectId: selectedProjectForMap._id, 
                      isPublic: !selectedProjectForMap.isPublic 
                    });
                    setSelectedProjectForMap({...selectedProjectForMap, isPublic: !selectedProjectForMap.isPublic});
                  }}
                  className={`px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                    selectedProjectForMap.isPublic 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {selectedProjectForMap.isPublic ? '👁️ Public' : '🔒 Private'}
                </button>
              </div>

              <MapCoordinatePicker
                latitude={selectedProjectForMap.coordinates?.latitude || 13.1469299}
                longitude={selectedProjectForMap.coordinates?.longitude || 123.7494046}
                onLocationSelect={(lat, lng) => {
                  setSelectedProjectForMap({
                    ...selectedProjectForMap,
                    coordinates: { latitude: lat, longitude: lng }
                  });
                }}
                height="450px"
              />
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={async () => {
                    await handleUpdateProjectCoords(
                      selectedProjectForMap._id,
                      selectedProjectForMap.coordinates.latitude,
                      selectedProjectForMap.coordinates.longitude
                    );
                    setSelectedProjectForMap(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={updatingCoords}
                >
                  {updatingCoords ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Location</>}
                </Button>
                <Button
                  onClick={() => setSelectedProjectForMap(null)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Event Map Picker Modal */}
        {selectedEventForMap && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl border border-white/10 p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-500" />
                  Set Event Location: {selectedEventForMap.title}
                </h3>
                <Button
                  onClick={() => setSelectedEventForMap(null)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="mb-4 flex items-center gap-3 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Visibility:
                </label>
                <button
                  onClick={async () => {
                    await toggleEventVisibility({ 
                      eventId: selectedEventForMap._id, 
                      isPublic: !selectedEventForMap.isPublic 
                    });
                    setSelectedEventForMap({...selectedEventForMap, isPublic: !selectedEventForMap.isPublic});
                  }}
                  className={`px-3 py-1 rounded-lg font-medium text-sm transition-colors ${
                    selectedEventForMap.isPublic 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {selectedEventForMap.isPublic ? '👁️ Public' : '🔒 Private'}
                </button>
              </div>

              <MapCoordinatePicker
                latitude={selectedEventForMap.coordinates?.latitude || 13.1469299}
                longitude={selectedEventForMap.coordinates?.longitude || 123.7494046}
                onLocationSelect={(lat, lng) => {
                  setSelectedEventForMap({
                    ...selectedEventForMap,
                    coordinates: { latitude: lat, longitude: lng }
                  });
                }}
                height="450px"
              />
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={async () => {
                    await handleUpdateEventCoords(
                      selectedEventForMap._id,
                      selectedEventForMap.coordinates.latitude,
                      selectedEventForMap.coordinates.longitude
                    );
                    setSelectedEventForMap(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={updatingCoords}
                >
                  {updatingCoords ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Location</>}
                </Button>
                <Button
                  onClick={() => setSelectedEventForMap(null)}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
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
