"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Calendar, MessageSquare, Briefcase, Users,
  Activity, Settings, LogOut, ChevronLeft,
  ChevronRight, PlusCircle, Home
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "Members", href: "/members", icon: Users },
  { label: "Activity", href: "/activity", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
];

const CollabiLogo = ({ collapsed, isDarkMode }) => {
  if (collapsed) {
    return (
      <div className="flex items-center justify-center">
        <div className="w-14 h-14 rounded-xl overflow-hidden">
          <Image 
            src="/collabi.png" 
            alt="Collabi" 
            width={56} 
            height={56}
            className="object-cover"
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl overflow-hidden">
        <Image 
          src="/collabi.png" 
          alt="Collabi" 
          width={56} 
          height={56}
          className="object-cover"
        />
      </div>
      <span className="text-base font-semibold">
        <span className={isDarkMode ? "text-white" : "text-gray-900"}>Coll</span>
        <span className="text-[#4B0082]">abi</span>
      </span>
    </div>
  );
};

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const router = useRouter();
  const { themeClass, isDarkMode } = useTheme();
  const [userName, setUserName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUserName(u.name || "");
      } catch {}
    }
  }, []);

  const isActive = (href) => pathname === href;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!mounted) return null;

  const sidebarBg = isDarkMode ? "bg-[#0f0f12]" : "bg-white";
  const border = isDarkMode ? "border-r border-[#1f1f24]" : "border-r border-gray-100";

  return (
    <aside 
      className={`fixed left-0 top-0 h-full flex flex-col transition-all duration-300 z-30
        ${collapsed ? "w-20" : "w-64"}
        ${sidebarBg} ${border}
      `}
    >
      <div className={`h-20 flex items-center border-b border-inherit ${collapsed ? "justify-center" : "px-6"}`}>
        <CollabiLogo collapsed={collapsed} isDarkMode={isDarkMode} />
      </div>

      <div className={`p-4 ${collapsed ? "px-2" : ""}`}>
        <button 
          onClick={() => router.push("/tasks")}
          className={`w-full bg-[#4B0082] hover:bg-[#3a0066] text-white rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all duration-200 text-sm font-medium ${collapsed ? "px-2" : ""}`}
        >
          <PlusCircle className="w-4 h-4" />
          {!collapsed && <span>Add New Task</span>}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-xl transition-all duration-200 text-sm
                ${collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}
                ${active 
                  ? isDarkMode
                    ? "bg-[#4B0082]/20 text-[#A855F7]"
                    : "bg-[#4B0082]/10 text-[#4B0082]"
                  : isDarkMode
                    ? "text-gray-400 hover:bg-white/5 hover:text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`p-4 border-t ${isDarkMode ? "border-[#1f1f24]" : "border-gray-100"} ${collapsed ? "px-2" : ""}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 text-sm text-red-400 hover:bg-red-500/10
            ${collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"}
          `}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      <button
        onClick={onToggle}
        className={`
          absolute -right-3 top-1/2 -translate-y-1/2 z-40
          w-6 h-6 rounded-full border flex items-center justify-center
          transition-all hover:scale-110 shadow-md
          ${isDarkMode
            ? "bg-[#1a1a1f] border-[#2a2a2f] text-gray-400 hover:text-white hover:border-[#A855F7]"
            : "bg-white border-gray-200 text-gray-500 hover:text-[#4B0082] hover:border-[#4B0082]"
          }
        `}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}