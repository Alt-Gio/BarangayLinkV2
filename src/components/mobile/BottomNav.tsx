"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Briefcase, 
  CheckSquare, 
  Calendar, 
  MessageCircle,
  FolderOpen,
  LayoutDashboard
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Briefcase, label: "Projects", path: "/projects" },
    { icon: CheckSquare, label: "Tasks", path: "/tasks/my-tasks" },
    { icon: MessageCircle, label: "Chat", path: "/messages" },
    { icon: Calendar, label: "Events", path: "/events" },
  ];

  const isActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/10 safe-area-pb">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors touch-manipulation ${
                active ? "text-emerald-500" : "text-gray-400"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs font-medium">{item.label}</span>
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-t-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
