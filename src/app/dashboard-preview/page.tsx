"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  Hammer, 
  UserCheck, 
  Calendar, 
  FileText, 
  BarChart3, 
  Settings,
  User,
  Briefcase,
  Crown,
  Eye
} from 'lucide-react';

export default function DashboardPreviewPage() {
  const { user } = useUser();
  const [selectedRole, setSelectedRole] = useState<'WORKER' | 'BUILDER' | 'MANAGER' | 'ADMIN'>('WORKER');

  const roles = [
    {
      name: 'WORKER' as const,
      label: 'Worker',
      description: 'Community member with basic access',
      icon: User,
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/20',
      features: [
        'View assigned tasks',
        'Track personal progress',
        'Join community events',
        'Basic profile management',
        'Achievement system'
      ]
    },
    {
      name: 'BUILDER' as const,
      label: 'Builder',
      description: 'Project coordinator with team management',
      icon: Hammer,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      features: [
        'All Worker features',
        'Create and manage tasks',
        'Coordinate team projects',
        'View team performance',
        'Document management'
      ]
    },
    {
      name: 'MANAGER' as const,
      label: 'Manager',
      description: 'Department head with oversight capabilities',
      icon: Briefcase,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      features: [
        'All Builder features',
        'Department analytics',
        'Budget management',
        'Event creation',
        'User role management',
        'Advanced reporting'
      ]
    },
    {
      name: 'ADMIN' as const,
      label: 'Administrator',
      description: 'System administrator with full access',
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      features: [
        'All Manager features',
        'System configuration',
        'User management',
        'Security settings',
        'Database administration',
        'Full system control'
      ]
    }
  ];

  const sidebarSections = {
    WORKER: [
      'Dashboard Overview',
      'My Tasks',
      'Event Calendar',
      'Document Library'
    ],
    BUILDER: [
      'Dashboard Overview',
      'Project Management',
      'Task Management',
      'Team Tasks',
      'Event Calendar',
      'Document System'
    ],
    MANAGER: [
      'Dashboard Overview',
      'Project Management',
      'Task Management',
      'Event Management',
      'Document System',
      'Financial System'
    ],
    ADMIN: [
      'Dashboard Overview',
      'Project Management',
      'Task Management',
      'Event Management',
      'Registration Management',
      'Document System',
      'Financial System',
      'System Administrator'
    ]
  };

  const selectedRoleData = roles.find(role => role.name === selectedRole)!;
  const RoleIcon = selectedRoleData.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Design Preview</h1>
        <p className="text-gray-600">Experience the role-based sidebar navigation</p>
      </div>
      <div className="p-6 space-y-8">
        {/* Role Selector */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Role-Based Dashboard Preview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.name;
              
              return (
                <Card 
                  key={role.name}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedRole(role.name)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-lg ${role.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${role.color}`} />
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="bg-blue-600">
                          Selected
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{role.label}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          {/* Selected Role Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Role Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RoleIcon className={`w-5 h-5 ${selectedRoleData.color}`} />
                  <span>{selectedRoleData.label} Dashboard</span>
                </CardTitle>
                <CardDescription>
                  Features and capabilities available to this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedRoleData.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <span>Sidebar Navigation</span>
                </CardTitle>
                <CardDescription>
                  Navigation sections visible to this role
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 text-white">
                  {/* Mini Sidebar Header */}
                  <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-gray-700">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">BL</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">BarangayLink</div>
                      <div className="text-xs text-green-400">v2.0.0</div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  <div className="space-y-2">
                    {sidebarSections[selectedRole].map((section, index) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-2 px-2 py-1.5 rounded text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                      >
                        <div className="w-4 h-4 bg-gray-600 rounded"></div>
                        <span>{section}</span>
                      </div>
                    ))}
                  </div>

                  {/* Mini User Info */}
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {user?.firstName || 'Demo User'}
                        </div>
                        <div className={`text-xs ${selectedRoleData.color}`}>
                          {selectedRoleData.label}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Button 
              onClick={() => window.open('/dashboard', '_blank')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Live Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/collaboration', '_blank')}
            >
              <Users className="w-4 h-4 mr-2" />
              Try Collaboration
            </Button>
          </div>
        </div>

        {/* Design Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎨 Design System</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Dark sidebar with green accents</li>
                <li>• Role-based color coding</li>
                <li>• Collapsible navigation sections</li>
                <li>• User profile integration</li>
                <li>• Responsive design</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔐 Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Progressive feature access</li>
                <li>• Dynamic navigation menus</li>
                <li>• Permission-based visibility</li>
                <li>• Secure role management</li>
                <li>• Hierarchical permissions</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Real-time collaboration</li>
                <li>• Gamification system</li>
                <li>• Document management</li>
                <li>• Event coordination</li>
                <li>• Analytics dashboard</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
