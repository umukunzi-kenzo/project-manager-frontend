"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { Toaster } from "react-hot-toast";
import FloatingThemeToggle from "../components/FloatingThemeToggle";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter"});

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const pageTitles = {
  "/dashboard": "Home",
  "/projects": "Projects",
  "/tasks": "Tasks",
  "/calendar": "Calendar",
  "/messages": "Messages",
  "/members": "Members",
  "/activity": "Activity",
  "/settings": "Settings",
};

const authRoutes = ["/login", "/register"];


function LayoutContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  const isAuthRoute = authRoutes.includes(pathname);
  const showSidebar = !isAuthRoute;
  const title = pageTitles[pathname] || "Home";

  useEffect(() => {
    if (!isAuthRoute) {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setIsAuthorized(false);
        router.replace("/login");
        return;
      }
    }
    
    setIsAuthorized(true);
    
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState !== null) {
      setSidebarCollapsed(savedState === "true");
    }
    
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, [router, pathname, isAuthRoute]);

  useEffect(() => {
    if (pathname && isAuthorized === true && showSidebar) {
      setIsExiting(true);
      const exitTimer = setTimeout(() => {
        setDisplayChildren(children);
        setTimeout(() => {
          setIsExiting(false);
        }, 50);
      }, 450);
      return () => clearTimeout(exitTimer);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children, isAuthorized, showSidebar]);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

  const bgColor = isDarkMode ? "bg-[#0f0f12]" : "bg-gray-50";

  if (!isAuthRoute && isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f12]">
        <div className="w-8 h-8 border-4 border-[#4B0082] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showSidebar) {
    return (
      <div className="min-h-screen">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <TopBar title={title} sidebarCollapsed={sidebarCollapsed} />
        <main className={`${sidebarCollapsed ? "ml-20" : "ml-64"} pt-16 min-h-screen transition-all duration-300`}>
          <div className={`p-6 ${bgColor}`}>
            <div 
              className="transition-all duration-700"
              style={{
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: isVisible && !isExiting ? 1 : 0,
                transform: isVisible && !isExiting ? "translateY(0) scale(1)" : "translateY(20px) scale(0.985)",
                filter: isVisible && !isExiting ? "blur(0)" : "blur(4px)",
              }}
            >
              {displayChildren}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}

// Main Layout component
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <title>Collabi</title>
        <meta name="description" content="Team collaboration and project management made simple" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem("theme");
                  const isDark = saved === "dark";
                  if (isDark) {
                    document.documentElement.classList.add("dark");
                    document.body.classList.add("dark-mode");
                  } else {
                    document.documentElement.classList.remove("dark");
                    document.body.classList.add("light-mode");
                  }
                } catch (e) {
                  document.body.classList.add("light-mode");
                }
              })();
            `,
          }}
        />
        <script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className="h-full m-0 p-0" suppressHydrationWarning>
        <ThemeProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
          <FloatingThemeToggle />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#ffffff",
                color: "#1a1c23",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                fontWeight: "500",
              },
              success: { style: { background: "#10b981", color: "#ffffff" } },
              error: { style: { background: "#ef4444", color: "#ffffff" } },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}