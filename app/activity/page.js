"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { 
  Activity as ActivityIcon, 
  Calendar, Clock, CheckCircle, PlusCircle, 
  UserCheck, Edit2, Trash2, Archive, RotateCcw,
  Filter, ChevronDown, X, Users, FolderKanban, ListTodo,
  Search, Eye
} from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

function FilterDropdown({ value, onChange, options, isDarkMode, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
          isDarkMode 
            ? "bg-[#1a1c23] border border-[#2a2d35] text-gray-300 hover:bg-[#252832]"
            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{selected?.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-48 rounded-lg shadow-lg border overflow-hidden z-50 ${
          isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"
        }`}>
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                value === option.value
                  ? isDarkMode ? "bg-[#4B0082]/20 text-[#4B0082]" : "bg-purple-50 text-[#4B0082]"
                  : isDarkMode ? "text-gray-300 hover:bg-[#252832]" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityDetailModal({ activity, isOpen, onClose, isDarkMode }) {
  if (!isOpen || !activity) return null;

  const getTypeLabel = (type) => {
    const labels = {
      task_created: "Task Created",
      task_completed: "Task Completed",
      task_reopened: "Task Reopened",
      task_edited: "Task Edited",
      task_deleted: "Task Deleted",
      task_assigned: "Task Assigned",
      project_created: "Project Created",
      project_edited: "Project Edited",
      project_archived: "Project Archived",
      project_restored: "Project Restored",
      project_deleted: "Project Deleted",
    };
    return labels[type] || "Activity";
  };

  // Format message - only bold quoted text and user names
  const formatModalMessage = (message) => {
    // Bold only the quoted text (task names and project names)
    let formatted = message.replace(/"([^"]+)"/g, '<strong class="font-bold">"$1"</strong>');
    // Bold user names after "to", "by", "assigned to"
    formatted = formatted.replace(/to (\w+ \w+|\w+)/g, 'to <strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/by (\w+ \w+|\w+)/g, 'by <strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/assigned to (\w+ \w+|\w+)/g, 'assigned to <strong class="font-bold">$1</strong>');
    return formatted;
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4" onClick={onClose}>
      <div className={`max-w-md w-full rounded-xl shadow-xl p-6 ${isDarkMode ? "bg-[#1a1c23]" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Activity Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Type
            </label>
            <p className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {getTypeLabel(activity.type)}
            </p>
          </div>
          
          <div>
            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Description
            </label>
            <p 
              className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}
              dangerouslySetInnerHTML={{ __html: formatModalMessage(activity.message) }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Date
              </label>
              <p className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {activity.date}
              </p>
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Time
              </label>
              <p className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {activity.time}
              </p>
            </div>
          </div>
          
          {activity.user && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Performed By
              </label>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#4B0082]/20 flex items-center justify-center text-xs font-medium text-[#4B0082]">
                  {activity.user.charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {activity.user}
                </span>
              </div>
            </div>
          )}
          
          {activity.projectTitle && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Related Project
              </label>
              <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {activity.projectTitle}
              </p>
            </div>
          )}
          
          {activity.taskTitle && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Related Task
              </label>
              <p className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {activity.taskTitle}
              </p>
            </div>
          )}
          
          {activity.assignedTo && (
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Assigned To
              </label>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-medium text-green-500">
                  {activity.assignedTo.charAt(0).toUpperCase()}
                </div>
                <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {activity.assignedTo}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className={`flex-1 py-2 rounded-lg border transition-all ${
              isDarkMode 
                ? "border-gray-700 hover:bg-gray-800 text-gray-300" 
                : "border-gray-200 hover:bg-gray-50 text-gray-700"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ActivityCard({ activity, isDarkMode, onViewDetails }) {
  const getIcon = () => {
    switch (activity.type) {
      case "task_created":
        return <PlusCircle className="w-4 h-4 text-blue-400" />;
      case "task_completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "task_reopened":
        return <RotateCcw className="w-4 h-4 text-yellow-400" />;
      case "task_edited":
        return <Edit2 className="w-4 h-4 text-purple-400" />;
      case "task_deleted":
        return <Trash2 className="w-4 h-4 text-red-400" />;
      case "task_assigned":
        return <UserCheck className="w-4 h-4 text-cyan-400" />;
      case "project_created":
        return <FolderKanban className="w-4 h-4 text-purple-400" />;
      case "project_edited":
        return <Edit2 className="w-4 h-4 text-purple-400" />;
      case "project_archived":
        return <Archive className="w-4 h-4 text-orange-400" />;
      case "project_restored":
        return <RotateCcw className="w-4 h-4 text-green-400" />;
      case "project_deleted":
        return <Trash2 className="w-4 h-4 text-red-400" />;
      default:
        return <ActivityIcon className="w-4 h-4" />;
    }
  };

  const getBackgroundColor = () => {
    switch (activity.type) {
      case "task_completed":
        return isDarkMode ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200";
      case "task_created":
        return isDarkMode ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200";
      case "task_deleted":
      case "project_deleted":
        return isDarkMode ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200";
      case "project_created":
        return isDarkMode ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-200";
      default:
        return isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200";
    }
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (activity.user) {
      return activity.user.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Format message - only bold quoted text and user names
  const formatMessage = (message) => {
    // Bold only the quoted text (task names and project names)
    let formatted = message.replace(/"([^"]+)"/g, '<strong class="font-bold">"$1"</strong>');
    // Bold user names after "to", "by", "assigned to"
    formatted = formatted.replace(/to (\w+ \w+|\w+)/g, 'to <strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/by (\w+ \w+|\w+)/g, 'by <strong class="font-bold">$1</strong>');
    formatted = formatted.replace(/assigned to (\w+ \w+|\w+)/g, 'assigned to <strong class="font-bold">$1</strong>');
    return formatted;
  };

  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-lg hover:border-[#4B0082] group ${getBackgroundColor()}`}>
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#4B0082]/20 flex items-center justify-center text-sm font-medium text-[#4B0082]">
            {getUserInitial()}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span 
              className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
              dangerouslySetInnerHTML={{ __html: formatMessage(activity.message) }}
            />
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <Calendar className="w-3 h-3" />
              <span>{activity.date}</span>
            </div>
            <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <Clock className="w-3 h-3" />
              <span>{activity.time}</span>
            </div>
            {activity.user && (
              <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                <Users className="w-3 h-3" />
                <span>by <strong className="font-semibold">{activity.user}</strong></span>
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onViewDetails(activity)}
          className="p-1.5 rounded-lg hover:bg-purple-500/10 transition-colors opacity-0 group-hover:opacity-100"
          title="View details"
        >
          <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-[#4B0082] dark:hover:text-[#A855F7]" />
        </button>
      </div>
    </div>
  );
}

function ActivitySection({ title, activities, isDarkMode, onViewDetails }) {
  if (activities.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
      {activities.map((activity) => (
        <ActivityCard 
          key={activity.id} 
          activity={activity} 
          isDarkMode={isDarkMode}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}

export default function ActivityPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [currentUserName, setCurrentUserName] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setCurrentUserName(userData.name || "");
      } catch {}
    }
  }, []);

  const generateActivities = (projectsData) => {
    const activitiesList = [];

    projectsData.forEach(project => {
      // Project created activity
      activitiesList.push({
        id: `project_created_${project.id}`,
        type: "project_created",
        message: `Project "${project.title}" was created`,
        date: project.createdAt,
        time: new Date(project.createdAt).toLocaleTimeString(),
        timestamp: new Date(project.createdAt).getTime(),
        user: project.createdBy,
        projectId: project.id,
        projectTitle: project.title,
      });

      // Project archived/restored based on status
      if (project.archived) {
        activitiesList.push({
          id: `project_archived_${project.id}`,
          type: "project_archived",
          message: `Project "${project.title}" was archived`,
          date: project.updatedAt?.split('T')[0] || project.createdAt,
          time: new Date(project.updatedAt || project.createdAt).toLocaleTimeString(),
          timestamp: new Date(project.updatedAt || project.createdAt).getTime(),
          user: project.createdBy,
          projectId: project.id,
          projectTitle: project.title,
        });
      }

      // Task activities
      project.tasks.forEach(task => {
        // Task created
        activitiesList.push({
          id: `task_created_${task.id}`,
          type: "task_created",
          message: `Task "${task.title}" was added to project "${project.title}"`,
          date: task.createdAt.split('T')[0],
          time: new Date(task.createdAt).toLocaleTimeString(),
          timestamp: new Date(task.createdAt).getTime(),
          user: currentUserName,
          taskId: task.id,
          taskTitle: task.title,
          projectId: project.id,
          projectTitle: project.title,
        });

        // Task completed/uncompleted
        if (task.completed) {
          activitiesList.push({
            id: `task_completed_${task.id}`,
            type: "task_completed",
            message: `Task "${task.title}" was completed in project "${project.title}"`,
            date: task.updatedAt?.split('T')[0] || task.createdAt.split('T')[0],
            time: new Date(task.updatedAt || task.createdAt).toLocaleTimeString(),
            timestamp: new Date(task.updatedAt || task.createdAt).getTime(),
            user: currentUserName,
            taskId: task.id,
            taskTitle: task.title,
            projectId: project.id,
            projectTitle: project.title,
          });
        }

        // Task assigned
        if (task.assignedTo) {
          activitiesList.push({
            id: `task_assigned_${task.id}`,
            type: "task_assigned",
            message: `Task "${task.title}" was assigned to ${task.assignedTo} in project "${project.title}"`,
            date: task.createdAt.split('T')[0],
            time: new Date(task.createdAt).toLocaleTimeString(),
            timestamp: new Date(task.createdAt).getTime(),
            user: currentUserName,
            taskId: task.id,
            taskTitle: task.title,
            projectId: project.id,
            projectTitle: project.title,
            assignedTo: task.assignedTo,
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    activitiesList.sort((a, b) => b.timestamp - a.timestamp);
    
    return activitiesList;
  };

  const fetchActivities = async () => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.success) {
        const formattedProjects = data.data.map(project => ({
          id: project.id,
          title: project.title,
          status: project.status,
          createdAt: project.createdAt.split('T')[0],
          updatedAt: project.updatedAt?.split('T')[0],
          archived: project.archived,
          createdBy: project.createdBy?.name,
          tasks: project.tasks.map(task => ({
            id: task.id,
            title: task.title,
            completed: task.completed,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            assignedTo: task.assignedTo?.name,
          }))
        }));
        setProjects(formattedProjects);
        
        const generatedActivities = generateActivities(formattedProjects);
        setActivities(generatedActivities);
        setFilteredActivities(generatedActivities);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [router]);

  useEffect(() => {
    let filtered = [...activities];
    
    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(activity => activity.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.message.toLowerCase().includes(query) ||
        activity.projectTitle?.toLowerCase().includes(query) ||
        activity.taskTitle?.toLowerCase().includes(query) ||
        activity.user?.toLowerCase().includes(query)
      );
    }
    
    // Filter by date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const thisWeek = today - 604800000;
    const thisMonth = today - 2592000000;
    
    if (filterDate === "today") {
      filtered = filtered.filter(activity => activity.timestamp >= today);
    } else if (filterDate === "yesterday") {
      filtered = filtered.filter(activity => activity.timestamp >= yesterday && activity.timestamp < today);
    } else if (filterDate === "thisWeek") {
      filtered = filtered.filter(activity => activity.timestamp >= thisWeek);
    } else if (filterDate === "thisMonth") {
      filtered = filtered.filter(activity => activity.timestamp >= thisMonth);
    }
    
    setFilteredActivities(filtered);
  }, [filterType, filterDate, searchQuery, activities]);

  // Group activities by date section
  const getGroupedActivities = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const thisWeek = today - 604800000;
    
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: []
    };
    
    filteredActivities.forEach(activity => {
      if (activity.timestamp >= today) {
        groups.today.push(activity);
      } else if (activity.timestamp >= yesterday) {
        groups.yesterday.push(activity);
      } else if (activity.timestamp >= thisWeek) {
        groups.thisWeek.push(activity);
      } else {
        groups.earlier.push(activity);
      }
    });
    
    return groups;
  };

  const handleViewDetails = (activity) => {
    setSelectedActivity(activity);
    setModalOpen(true);
  };

  const typeOptions = [
    { value: "all", label: "All Activities" },
    { value: "task_created", label: "Task Created" },
    { value: "task_completed", label: "Task Completed" },
    { value: "task_assigned", label: "Task Assigned" },
    { value: "project_created", label: "Project Created" },
    { value: "project_archived", label: "Project Archived" },
  ];

  const dateOptions = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "thisWeek", label: "This Week" },
    { value: "thisMonth", label: "This Month" },
  ];

  const getActivityCount = (type) => {
    if (type === "all") return activities.length;
    return activities.filter(a => a.type === type).length;
  };

  const groupedActivities = getGroupedActivities();
  const hasActiveFilters = filterType !== "all" || filterDate !== "all" || searchQuery !== "";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#4B0082] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Activity</h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Track all activities across your projects and tasks
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{activities.length}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Activities</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-blue-400">{getActivityCount("task_created")}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Tasks Created</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-green-400">{getActivityCount("task_completed")}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Tasks Completed</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-purple-400">{getActivityCount("project_created")}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Projects Created</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities by task, project, or user..."
                className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? "bg-[#252832] border-[#2a2d35] text-white focus:ring-[#4B0082]/50" 
                    : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#4B0082]/50"
                }`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown 
                value={filterType} 
                onChange={setFilterType} 
                options={typeOptions} 
                isDarkMode={isDarkMode} 
                icon={ActivityIcon} 
              />
              <FilterDropdown 
                value={filterDate} 
                onChange={setFilterDate} 
                options={dateOptions} 
                isDarkMode={isDarkMode} 
                icon={Calendar} 
              />
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilterType("all");
                    setFilterDate("all");
                    setSearchQuery("");
                  }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                    isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <X className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed - Grouped by Date */}
        {filteredActivities.length === 0 ? (
          <div className={`p-12 rounded-xl border text-center ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <ActivityIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              No activities found
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedActivities.today.length > 0 && (
              <ActivitySection 
                title="Today" 
                activities={groupedActivities.today} 
                isDarkMode={isDarkMode}
                onViewDetails={handleViewDetails}
              />
            )}
            {groupedActivities.yesterday.length > 0 && (
              <ActivitySection 
                title="Yesterday" 
                activities={groupedActivities.yesterday} 
                isDarkMode={isDarkMode}
                onViewDetails={handleViewDetails}
              />
            )}
            {groupedActivities.thisWeek.length > 0 && (
              <ActivitySection 
                title="This Week" 
                activities={groupedActivities.thisWeek} 
                isDarkMode={isDarkMode}
                onViewDetails={handleViewDetails}
              />
            )}
            {groupedActivities.earlier.length > 0 && (
              <ActivitySection 
                title="Earlier" 
                activities={groupedActivities.earlier} 
                isDarkMode={isDarkMode}
                onViewDetails={handleViewDetails}
              />
            )}
          </div>
        )}
      </div>

      {/* Activity Details Modal */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
}