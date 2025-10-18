"use client";

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useDashboardData } from '@/hooks/useDashboardData';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const { currentUser, userRole } = useDashboardData();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar
        userRole={userRole || 'WORKER'}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 overflow-y-auto bg-gray-900">
        {children}
      </main>
    </div>
  );
}
