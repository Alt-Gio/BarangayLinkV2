"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { 
  Home, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  MessageCircle,
  FolderOpen,
  LayoutDashboard,
  Users,
  FileText
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen } = useSidebar();

  // Organized by hierarchy: Dashboard > Work Items > Communication
  const navItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      path: "/dashboard",
      color: "emerald",
      priority: 1
    },
    { 
      icon: Briefcase, 
      label: "Projects", 
      path: "/projects",
      color: "blue",
      priority: 2
    },
    { 
      icon: CheckSquare, 
      label: "Tasks", 
      path: "/tasks/my-duties",
      color: "purple",
      priority: 2
    },
    { 
      icon: MessageCircle, 
      label: "Messages", 
      path: "/messages",
      color: "orange",
      priority: 3
    },
    { 
      icon: Calendar, 
      label: "Events", 
      path: "/events",
      color: "pink",
      priority: 3
    },
  ];

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  const getColorClass = (color: string, active: boolean) => {
    if (!active) return "text-gray-400";
    
    switch(color) {
      case "emerald": return "text-emerald-500";
      case "blue": return "text-blue-500";
      case "purple": return "text-purple-500";
      case "orange": return "text-orange-500";
      case "pink": return "text-pink-500";
      default: return "text-emerald-500";
    }
  };

  const getGlowClass = (color: string) => {
    switch(color) {
      case "emerald": return "bg-emerald-500 shadow-emerald-500/50";
      case "blue": return "bg-blue-500 shadow-blue-500/50";
      case "purple": return "bg-purple-500 shadow-purple-500/50";
      case "orange": return "bg-orange-500 shadow-orange-500/50";
      case "pink": return "bg-pink-500 shadow-pink-500/50";
      default: return "bg-emerald-500 shadow-emerald-500/50";
    }
  };

  return (
    <div className={`
      md:hidden fixed bottom-0 left-0 right-0 z-40
      bg-gradient-to-t from-gray-900 via-gray-900 to-gray-900/95
      backdrop-blur-lg border-t border-white/10
      transition-transform duration-300 ease-out
      ${sidebarOpen ? 'translate-y-full' : 'translate-y-0'}
      safe-area-pb
    `}>
      {/* Subtle top glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`
                flex flex-col items-center justify-center
                flex-1 h-full space-y-1 px-1
                transition-all duration-200 touch-manipulation
                ${active ? 'transform -translate-y-1' : ''}
                ${getColorClass(item.color, active)}
                hover:scale-105 active:scale-95
              `}
            >
              <div className={`relative`}>
                <Icon className={`
                  w-6 h-6
                  transition-all duration-200
                  ${active ? 'scale-110 drop-shadow-lg' : ''}
                `} />
                {active && (
                  <div className="absolute inset-0 animate-ping opacity-20">
                    <Icon className="w-6 h-6" />
                  </div>
                )}
              </div>
              <span className={`
                text-[10px] font-semibold
                transition-all duration-200
                ${active ? 'scale-105' : ''}
              `}>
                {item.label}
              </span>
              {active && (
                <div className={`
                  absolute bottom-0 w-10 h-1 rounded-t-full
                  ${getGlowClass(item.color)}
                  shadow-lg animate-pulse
                `} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
