"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { 
  User, Mail, Lock, Save, AlertCircle, Eye, EyeOff,
  Moon, Sun, Bell, Shield, Trash2, LogOut, CheckCircle,
  Camera, X, ChevronDown
} from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

export default function SettingsPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  
  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
  });
  const [profileErrors, setProfileErrors] = useState({});
  
  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  
  // Avatar
  const [userAvatar, setUserAvatar] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
        setProfileForm({
          name: userData.name || "",
          email: userData.email || "",
        });
        setUserAvatar(userData.avatar || null);
      } catch {}
    }
    setLoading(false);
  }, []);

  // Same avatar URL function as TopBar
  const getAvatarUrl = () => {
    if (!userAvatar) return null;
    if (userAvatar.includes('googleusercontent.com') && !userAvatar.includes('?sz=')) {
      return `${userAvatar}?sz=96`;
    }
    return userAvatar;
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const parts = user.name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateProfile = () => {
    const errors = {};
    if (!profileForm.name.trim()) {
      errors.name = "Name is required";
    } else if (profileForm.name.length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (profileForm.name.length > 50) {
      errors.name = "Name must be less than 50 characters";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;
    
    setSaving(true);
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: profileForm.name }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local storage
        const stored = localStorage.getItem("user");
        if (stored) {
          const userData = JSON.parse(stored);
          userData.name = profileForm.name;
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
        }
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    
    setSaving(true);
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Verify current password using login endpoint
      const verifyResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: user?.email, 
          password: passwordForm.currentPassword 
        }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyData.success) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
        toast.error("Current password is incorrect");
        setSaving(false);
        return;
      }
      
      // If current password is correct, update the password
      const updateResponse = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });
      
      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        toast.success("Password updated successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(updateData.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/users/me/avatar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local storage with new avatar URL
        const stored = localStorage.getItem("user");
        if (stored) {
          const userData = JSON.parse(stored);
          userData.avatar = data.avatar;
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
          setUserAvatar(data.avatar);
        }
        toast.success("Avatar updated successfully!");
      } else {
        toast.error(data.message || "Failed to update avatar");
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setDeleting(true);
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.success("Account deleted successfully");
        router.push("/login");
      } else {
        toast.error(data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#4B0082] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto px-4">
        <div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Settings</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className={`rounded-xl border overflow-hidden h-fit ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <div className="p-6 text-center border-b" style={{ borderColor: isDarkMode ? "#2a2d35" : "#e5e7eb" }}>
              <div className="relative inline-block">
                <div 
                  onClick={handleAvatarClick}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4B0082] to-[#3a0066] flex items-center justify-center text-white text-3xl font-bold cursor-pointer hover:opacity-80 transition-all mx-auto overflow-hidden"
                >
                  {userAvatar && !avatarError ? (
                    <img
                      src={getAvatarUrl()}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#4B0082] text-white hover:opacity-90 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <h2 className={`text-lg font-semibold mt-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {user?.name}
              </h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {user?.email}
              </p>
              <p className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${isDarkMode ? "bg-[#252832] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                {user?.role || "MEMBER"}
              </p>
            </div>
            <div className="p-4 space-y-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Section */}
            <div className={`rounded-xl border p-6 ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Profile Information
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#4B0082]/50 ${
                      isDarkMode 
                        ? "bg-[#252832] border-[#2a2d35] text-white" 
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    } ${profileErrors.name ? "border-red-500" : ""}`}
                  />
                  {profileErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{profileErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className={`w-full px-3 py-2 rounded-lg border cursor-not-allowed opacity-60 ${
                      isDarkMode 
                        ? "bg-[#252832] border-[#2a2d35] text-gray-400" 
                        : "bg-gray-100 border-gray-200 text-gray-500"
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                    Email cannot be changed
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#4B0082" }}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </form>
            </div>

            {/* Password Section */}
            <div className={`rounded-xl border p-6 ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Change Password
              </h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#4B0082]/50 pr-10 ${
                        isDarkMode 
                          ? "bg-[#252832] border-[#2a2d35] text-white" 
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      } ${passwordErrors.currentPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#4B0082]/50 pr-10 ${
                        isDarkMode 
                          ? "bg-[#252832] border-[#2a2d35] text-white" 
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      } ${passwordErrors.newPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#4B0082]/50 pr-10 ${
                        isDarkMode 
                          ? "bg-[#252832] border-[#2a2d35] text-white" 
                          : "bg-gray-50 border-gray-200 text-gray-900"
                      } ${passwordErrors.confirmPassword ? "border-red-500" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#4B0082" }}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Update Password
                </button>
              </form>
            </div>

            {/* Appearance Section */}
            <div className={`rounded-xl border p-6 ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Appearance
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {isDarkMode ? "Dark Mode" : "Light Mode"}
                    </p>
                    <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {isDarkMode ? "Currently using dark theme" : "Currently using light theme"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDarkMode 
                      ? "bg-[#4B0082] text-white hover:bg-[#3a0066]" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  Switch to {isDarkMode ? "Light" : "Dark"} Mode
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4" onClick={() => setDeleteModalOpen(false)}>
          <div className={`max-w-md w-full rounded-xl shadow-xl p-6 ${isDarkMode ? "bg-[#1a1c23]" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Delete Account
              </h2>
            </div>
            
            <p className={`text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            
            <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-200"}`}>
              <p className="text-sm text-red-400">
                Warning: All your projects and tasks will be permanently deleted.
              </p>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Type <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-red-500/50 ${
                  isDarkMode 
                    ? "bg-[#252832] border-[#2a2d35] text-white" 
                    : "bg-gray-50 border-gray-200 text-gray-900"
                }`}
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE" || deleting}
                className="flex-1 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#ef4444" }}
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className={`flex-1 py-2 rounded-lg border transition-all ${
                  isDarkMode 
                    ? "border-gray-700 hover:bg-gray-800 text-gray-300" 
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}