"use client";

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  userRole: string;
}

export function ProjectTabs({ activeTab, onTabChange, userRole }: ProjectTabsProps) {
  const tabs = [
    { id: 'overview', label: 'Overview', roles: ['ADMIN', 'MANAGER', 'BUILDER', 'WORKER'] },
    { id: 'tasks', label: 'Tasks', roles: ['ADMIN', 'MANAGER', 'BUILDER', 'WORKER'] },
    { id: 'events', label: 'Events', roles: ['ADMIN', 'MANAGER', 'BUILDER', 'WORKER'] },
    { id: 'team', label: 'Team', roles: ['ADMIN', 'MANAGER', 'BUILDER'] },
    { id: 'settings', label: 'Settings', roles: ['ADMIN', 'MANAGER', 'BUILDER'] }
  ];

  const visibleTabs = tabs.filter(tab => tab.roles.includes(userRole));

  return (
    <div className="border-b border-gray-700 bg-gray-800 rounded-t-lg">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
