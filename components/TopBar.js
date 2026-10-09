"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Menu, X, PlusCircle, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "../context/ThemeContext";
import { useRouter } from "next/navigation";
import { Home, FolderKanban, Calendar, MessageSquare, Users, Activity, Settings, CheckSquare } from "lucide-react";

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

export default function TopBar({ title }) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userAvatar, setUserAvatar] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUserName(u.name || "User");
        setUserRole(u.role || "Member");
        setUserAvatar(u.avatar || null);
      } catch {}
    }

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const topBarBg = isDarkMode
    ? scrolled
      ? "bg-[#0f0f12]/95 backdrop-blur-xl"
      : "bg-[#0f0f12]"
    : scrolled
    ? "bg-white/95 backdrop-blur-xl"
    : "bg-white";

  const getUserInitials = () => {
    if (!userName) return "U";
    const parts = userName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (!userAvatar) return null;
    if (userAvatar.includes("googleusercontent.com") && !userAvatar.includes("?sz=")) {
      return `${userAvatar}?sz=40`;
    }
    return userAvatar;
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 z-20 transition-all duration-300 ${topBarBg} ${
          isDarkMode ? "border-b border-[#1f1f24]" : "border-b border-gray-100"
        } left-16 lg:left-56`}
        style={{ marginLeft: 0 }}
      >
        <div className="flex items-center justify-between px-3 sm:px-5 h-16">
          <div className="flex items-center gap-3 min-w-0">
            <h1
              className={`text-lg sm:text-xl font-semibold truncate ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="relative max-md:hidden">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                placeholder="Search..."
                className={`w-40 lg:w-72 pl-9 pr-4 py-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4B0082]/50 ${
                  isDarkMode
                    ? "bg-[#1a1a1f] border border-[#2a2a2f] text-white placeholder-gray-500 focus:border-[#4B0082]"
                    : "bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#4B0082]"
                }`}
              />
            </div>

            <button
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-100"
              }`}
            >
              <Bell className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
              >
                {userAvatar && !avatarError ? (
                  <img
                    src={getAvatarUrl()}
                    alt={userName}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={() => setAvatarError(true)}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4B0082] to-[#3a0066] flex items-center justify-center text-white text-xs font-bold">
                    {getUserInitials()}
                  </div>
                )}
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    userDropdownOpen ? "rotate-180" : ""
                  } ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setUserDropdownOpen(false)} />
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg border overflow-hidden z-40 ${
                      isDarkMode ? "bg-[#1a1a1f] border-gray-800" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className={`px-4 py-3 border-b ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
                      <div className="flex items-center gap-3">
                        {userAvatar && !avatarError ? (
                          <img
                            src={getAvatarUrl()}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={() => setAvatarError(true)}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4B0082] to-[#3a0066] flex items-center justify-center text-white text-sm font-bold">
                            {getUserInitials()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold truncate ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {userName}
                          </p>
                          <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {userRole}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleSettings}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all ${
                        isDarkMode
                          ? "text-gray-300 hover:bg-white/5"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all border-t ${
                        isDarkMode
                          ? "text-red-400 hover:bg-red-500/10 border-gray-800"
                          : "text-red-600 hover:bg-red-50 border-gray-100"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
            <div
              className={`w-64 h-full ${
                isDarkMode ? "bg-[#0f0f12]" : "bg-white"
              } border-r ${isDarkMode ? "border-[#1f1f24]" : "border-gray-100"} flex flex-col`}
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg overflow-hidden">
                    <Image src="/collabi.png" alt="Collabi" width={40} height={40} className="object-cover" />
                  </div>
                  <span className="text-sm font-semibold">
                    <span className={isDarkMode ? "text-white" : "text-gray-900"}>Coll</span>
                    <span className="text-[#4B0082]">abi</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                >
                  <X className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-gray-900"}`} />
                </button>
              </div>
              <div className="p-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    router.push("/tasks");
                  }}
                  className="w-full bg-[#4B0082] hover:bg-[#3a0066] text-white rounded-lg py-2 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Task
                </button>
              </div>
              <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                      isDarkMode
                        ? "text-gray-400 hover:bg-white/5 hover:text-white"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
              <div className="p-3 border-t border-inherit">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}