"use client";

import { useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
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
} from "lucide-react";
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

  const currentUser = useQuery(api.users.getCurrentUser);
  const departments = useQuery(api.departments.getAllDepartmentsWithStats);
  const userLevels = useQuery(api.departments.getAllUserLevels);
  const backups = useQuery(api.backup.getAllBackups);
  const backupSchedule = useQuery(api.backup.getBackupSchedule);
  
  // Actions and Mutations
  const createBackup = useAction(api.backup.createFullBackup);
  const createDepartmentMut = useMutation(api.departments.createDepartment);
  const updateDepartmentMut = useMutation(api.departments.updateDepartment);
  const deleteDepartmentMut = useMutation(api.departments.deleteDepartment);
  const updateBackupScheduleMut = useMutation(api.backup.updateBackupSchedule);

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

  const [newDepartment, setNewDepartment] = useState({ name: "", description: "", contactEmail: "", location: "" });
  const [editingDept, setEditingDept] = useState<any>(null);
  const [backupInProgress, setBackupInProgress] = useState(false);

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
      setNewDepartment({ name: "", description: "", contactEmail: "", location: "" });
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

  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  if (!isLoaded || !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
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
            <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
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
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                          >
                            <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                            <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                            <option value="UTC">UTC (GMT+0)</option>
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
                      <Lock className="w-5 h-5 text-emerald-500" />
                      Security Settings
                    </h2>
                    <div className="space-y-6">
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
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.requireMFA}
                            onChange={(e) => setSettings({ ...settings, requireMFA: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20"
                          />
                          <div>
                            <p className="text-white font-medium">Require Multi-Factor Authentication</p>
                            <p className="text-gray-400 text-sm">Force all users to enable MFA</p>
                          </div>
                        </label>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.allowPublicRegistration}
                            onChange={(e) => setSettings({ ...settings, allowPublicRegistration: e.target.checked })}
                            className="w-5 h-5 rounded border-white/20"
                          />
                          <div>
                            <p className="text-white font-medium">Allow Public Registration</p>
                            <p className="text-gray-400 text-sm">Let users register without invitation</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications" className="space-y-6">
                  <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-emerald-500" />
                      Notification Settings
                    </h2>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                          className="w-5 h-5 rounded border-white/20"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">Email Notifications</p>
                          <p className="text-gray-400 text-sm">Send notifications via email</p>
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
                          <p className="text-white font-medium">Project Updates</p>
                          <p className="text-gray-400 text-sm">Notify users about project changes</p>
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
                          <p className="text-white font-medium">Task Reminders</p>
                          <p className="text-gray-400 text-sm">Send reminders for upcoming deadlines</p>
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
                          <p className="text-white font-medium">Event Alerts</p>
                          <p className="text-gray-400 text-sm">Notify about upcoming events</p>
                        </div>
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </label>
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
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
                            disabled={!settings.autoBackup}
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg mb-6">
                      <Button 
                        onClick={handleCreateBackup}
                        disabled={backupInProgress}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {backupInProgress ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Creating Backup...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Create Backup Now
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={handleUpdateBackupSchedule}
                        variant="outline" 
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Schedule
                      </Button>
                    </div>

                    {/* Backup History */}
                    <div className="space-y-3">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        Backup History
                      </h3>
                      {backups && backups.length > 0 ? (
                        backups.slice(0, 5).map((backup: any) => (
                          <div 
                            key={backup._id}
                            className="p-4 bg-white/5 border border-white/10 rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <HardDrive className="w-5 h-5 text-blue-400" />
                                <div>
                                  <p className="text-white font-medium">
                                    {backup.type === 'full' ? 'Full Backup' : 'Partial Backup'}
                                  </p>
                                  <p className="text-gray-400 text-sm">
                                    {new Date(backup.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <Badge className={`${
                                backup.status === 'completed' ? 'bg-emerald-600' :
                                backup.status === 'failed' ? 'bg-red-600' :
                                'bg-yellow-600'
                              } text-white`}>
                                {backup.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>{backup.recordCount} records</span>
                              <span>•</span>
                              <span>{backup.tables?.length} tables</span>
                              <span>•</span>
                              <span>By {backup.creatorName}</span>
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
      </div>
    </AdminGuard>
  );
}
