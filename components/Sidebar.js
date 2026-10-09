"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  FolderKanban, CheckSquare, Calendar, MessageSquare, Users,
  Activity, Settings, LogOut, ChevronLeft, ChevronRight,
  PlusCircle, Home
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
        <div className="w-9 h-9 rounded-lg overflow-hidden">
          <Image src="/collabi.png" alt="Collabi" width={36} height={36} className="object-cover" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-lg overflow-hidden">
        <Image src="/collabi.png" alt="Collabi" width={40} height={40} className="object-cover" />
      </div>
      <span className="text-sm font-semibold">
        <span className={isDarkMode ? "text-white" : "text-gray-900"}>Coll</span>
        <span className="text-[#4B0082]">abi</span>
      </span>
    </div>
  );
};

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isActive = (href) => pathname === href;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!mounted) return null;

  // On mobile: ALWAYS collapsed (icon-only). On desktop: respect prop.
  const effectiveCollapsed = isMobile ? true : collapsed;
  const width = effectiveCollapsed ? "w-16" : "w-56";

  const sidebarBg = isDarkMode ? "bg-[#0f0f12]" : "bg-white";
  const border = isDarkMode ? "border-r border-[#1f1f24]" : "border-r border-gray-100";

  return (
    <aside
      className={`fixed left-0 top-0 h-full flex flex-col transition-all duration-300 z-30
        ${width}
        ${sidebarBg} ${border}
      `}
    >
      <div className={`h-16 flex items-center border-b border-inherit ${effectiveCollapsed ? "justify-center" : "px-5"}`}>
        <CollabiLogo collapsed={effectiveCollapsed} isDarkMode={isDarkMode} />
      </div>

      <div className={`p-2.5 ${effectiveCollapsed ? "px-2" : "px-3"}`}>
        <button
          onClick={() => router.push("/tasks")}
          className={`w-full bg-[#4B0082] hover:bg-[#3a0066] text-white rounded-lg py-2 flex items-center justify-center gap-2 transition-all text-sm font-medium ${effectiveCollapsed ? "px-2" : ""}`}
          title="Add New Task"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          {!effectiveCollapsed && <span>Add New Task</span>}
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg transition-all duration-200 text-sm
                ${effectiveCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
                ${active
                  ? isDarkMode
                    ? "bg-[#4B0082]/20 text-[#A855F7]"
                    : "bg-[#4B0082]/10 text-[#4B0082]"
                  : isDarkMode
                    ? "text-gray-400 hover:bg-white/5 hover:text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
              title={effectiveCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!effectiveCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={`p-2.5 border-t ${isDarkMode ? "border-[#1f1f24]" : "border-gray-100"} ${effectiveCollapsed ? "px-2" : "px-3"}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-lg transition-all text-sm text-red-400 hover:bg-red-500/10
            ${effectiveCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"}
          `}
          title={effectiveCollapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!effectiveCollapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Toggle button — desktop only */}
      <button
        onClick={onToggle}
        className={`
          hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-40
          w-6 h-6 rounded-full border items-center justify-center
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