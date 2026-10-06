"use client";

import { useTheme } from "../context/ThemeContext";
import { Construction, Calendar, Mail, Users, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ComingSoon({ title, description, icon: Icon }) {
  const { isDarkMode } = useTheme();
  const router = useRouter();

  const getIcon = () => {
    if (Icon) return <Icon className="w-20 h-20" />;
    switch (title?.toLowerCase()) {
      case "messages":
        return <Mail className="w-20 h-20" />;
      case "members":
        return <Users className="w-20 h-20" />;
      default:
        return <Construction className="w-20 h-20" />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className={`inline-flex p-6 rounded-full mb-6 ${isDarkMode ? "bg-[#1a1c23]" : "bg-gray-100"}`}>
          <div className="text-[#4B0082] dark:text-[#A855F7]">
            {getIcon()}
          </div>
        </div>
        
        <h1 className={`text-3xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {title || "Coming Soon"}
        </h1>
        
        <p className={`text-base mb-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {description || "This feature is currently under development. We're working hard to bring it to you soon!"}
        </p>
        
        <div className={`p-4 rounded-xl mb-8 ${isDarkMode ? "bg-[#1a1c23]" : "bg-gray-50"} border ${isDarkMode ? "border-[#2a2d35]" : "border-gray-200"}`}>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-[#4B0082] dark:text-[#A855F7]" />
            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              Expected release: Coming weeks
            </span>
          </div>
        </div>
        
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90"
          style={{ backgroundColor: "#4B0082" }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}