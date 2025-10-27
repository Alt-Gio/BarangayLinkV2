"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Briefcase,
  Calendar,
  MessageSquare,
  LayoutDashboard,
  CheckSquare,
  Users
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { href: '/projects', icon: Briefcase, label: 'Projects' },
    { href: '/kanban', icon: CheckSquare, label: 'Tasks' },
    { href: '/events', icon: Calendar, label: 'Events' },
    { href: '/messages', icon: MessageSquare, label: 'Chat' },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/98 backdrop-blur-lg border-t border-gray-800 z-50 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation min-w-[60px] ${
                isActive 
                  ? 'text-emerald-500 bg-emerald-500/10' 
                  : 'text-gray-400 hover:text-white active:scale-95'
              }`}
            >
              <Icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
