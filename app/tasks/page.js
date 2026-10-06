"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { 
  Search, Plus, ChevronDown, Filter, X, 
  Calendar, Clock, MoreVertical, CheckSquare,
  Trash2, Edit2, UserCheck, AlertCircle, Save,
  FolderKanban, ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

const teamMembers = [
  { id: 1, name: "John Doe", email: "john@collabi.com", avatar: "JD" },
  { id: 2, name: "Jane Smith", email: "jane@collabi.com", avatar: "JS" },
  { id: 3, name: "Mike Johnson", email: "mike@collabi.com", avatar: "MJ" },
  { id: 4, name: "Sarah Lee", email: "sarah@collabi.com", avatar: "SL" },
];

function PriorityBadge({ priority }) {
  const config = {
    HIGH: "bg-red-500/10 text-red-400",
    MEDIUM: "bg-yellow-500/10 text-yellow-400",
    LOW: "bg-blue-500/10 text-blue-400",
  };
  const labels = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${config[priority]}`}>
      {labels[priority]}
    </span>
  );
}

function StatusBadge({ status }) {
  const statusMap = {
    COMPLETED: "completed",
    IN_PROGRESS: "in-progress",
    OVERDUE: "overdue",
    PLANNING: "planning",
  };
  
  const displayStatus = statusMap[status] || status;
  
  const config = {
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    "in-progress": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    overdue: "bg-red-500/10 text-red-400 border-red-500/20",
    planning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  const labels = { completed: "Completed", "in-progress": "In Progress", overdue: "Overdue", planning: "Planning" };
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${config[displayStatus] || config["planning"]}`}>
      {labels[displayStatus] || "Planning"}
    </span>
  );
}

// Due Date Badge Component
function DueDateBadge({ dueDate, completed }) {
  if (completed) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = due - today;
  const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (daysLeft < 0) {
    return <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">Overdue</span>;
  } else if (daysLeft === 0) {
    return <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">Today</span>;
  } else if (daysLeft === 1) {
    return <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">Tomorrow</span>;
  } else if (daysLeft <= 7) {
    return <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">This week</span>;
  }
  
  return null;
}

function EditTaskModal({ task, project, isOpen, onClose, onSaveEdit, isDarkMode }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeRef = useRef(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setAssignee(task.assignedTo || "");
    }
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) {
        setAssigneeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (title.trim()) {
      onSaveEdit(task.id, title, assignee);
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className={`max-w-md w-full rounded-xl shadow-xl p-6 ${isDarkMode ? "bg-[#1a1c23]" : "bg-white"}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Edit Task
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 ${
                isDarkMode
                  ? "bg-[#252832] border-[#2a2d35] text-white focus:ring-[#4B0082]/50 focus:border-[#4B0082]"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#4B0082]/50 focus:border-[#4B0082]"
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Assignee
            </label>
            <div className="relative" ref={assigneeRef}>
              <button
                type="button"
                onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                  isDarkMode 
                    ? "bg-[#252832] border-[#2a2d35] text-white hover:bg-[#2d3038]"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="truncate">{assignee || "Unassigned"}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${assigneeDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {assigneeDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 w-full rounded-lg border shadow-lg z-50 overflow-hidden ${
                  isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"
                }`}>
                  <button
                    type="button"
                    onClick={() => { setAssignee(""); setAssigneeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      !assignee
                        ? isDarkMode ? "bg-[#4B0082]/20 text-[#4B0082]" : "bg-purple-50 text-[#4B0082]"
                        : isDarkMode ? "text-gray-300 hover:bg-[#252832]" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Unassigned
                  </button>
                  {teamMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => { setAssignee(member.name); setAssigneeDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                        assignee === member.name
                          ? isDarkMode ? "bg-[#4B0082]/20 text-[#4B0082]" : "bg-purple-50 text-[#4B0082]"
                          : isDarkMode ? "text-gray-300 hover:bg-[#252832]" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium ${
                        isDarkMode ? "bg-[#252832] text-gray-300" : "bg-gray-200 text-gray-600"
                      }`}>
                        {member.avatar}
                      </div>
                      <span>{member.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${isDarkMode ? "bg-[#252832]" : "bg-gray-50"}`}>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              Project: <span className="font-medium">{project?.title || "Unknown"}</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: "#4B0082" }}
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
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
  );
}

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
        <div className={`absolute top-full left-0 mt-1 w-40 rounded-lg shadow-lg border overflow-hidden z-50 ${
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

function TaskCard({ task, isDarkMode, onToggle, onEdit, onDelete, onAssignToMe, togglingTask }) {
  const getDaysLeft = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end - today;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysLeft(task.projectEndDate);
  const isOverdue = daysLeft < 0 && !task.completed;
  
  // Get border class based on due date (only left border, no background change)
  const getBorderClass = () => {
    if (task.completed) return "";
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.projectEndDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return "border-l-4 border-l-red-500";
    } else if (daysLeft === 0) {
      return "border-l-4 border-l-orange-500";
    } else if (daysLeft === 1) {
      return "border-l-4 border-l-yellow-500";
    } else if (daysLeft <= 7) {
      return "border-l-4 border-l-green-500";
    }
    
    return "";
  };

  return (
    <div
      className={`p-4 rounded-xl border transition-all hover:shadow-lg ${getBorderClass()} ${
        isDarkMode 
          ? "bg-[#1a1c23] border-[#2a2d35] hover:border-[#4B0082]" 
          : "bg-white border-gray-200 hover:border-[#4B0082]"
      } ${task.completed ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-4">
        {/* Custom Checkbox with Brand Color */}
        <label className="relative flex items-center justify-center mt-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task.id, task.completed)}
            disabled={togglingTask === task.id}
            className="peer w-5 h-5 opacity-0 absolute cursor-pointer"
          />
          <div className="w-5 h-5 rounded border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center peer-checked:bg-[#4B0082] peer-checked:border-[#4B0082] peer-checked:text-white transition-all">
            {task.completed && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className={`font-semibold ${task.completed ? "line-through" : ""} ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {task.title}
            </h3>
            <PriorityBadge priority={task.projectPriority} />
            <DueDateBadge dueDate={task.projectEndDate} completed={task.completed} />
          </div>
          
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <FolderKanban className="w-3 h-3" />
              <span>{task.projectTitle}</span>
            </div>
            <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <UserCheck className="w-3 h-3" style={{ color: "#4B0082" }} />
              <span>{task.assignedTo || "Unassigned"}</span>
            </div>
            <div className={`flex items-center gap-1 ${isOverdue && !task.completed ? "text-red-400" : isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              <Calendar className="w-3 h-3" />
              <span>Due {new Date(task.projectEndDate).toLocaleDateString()}</span>
            </div>
            <StatusBadge status={task.projectStatus} />
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg hover:bg-purple-500/10 transition-colors"
          >
            <Edit2 className="w-4 h-4" style={{ color: "#4B0082" }} />
          </button>
          <button
            onClick={() => onAssignToMe(task.id)}
            className="p-1.5 rounded-lg hover:bg-green-500/10 transition-colors"
            title="Assign to me"
          >
            <UserCheck className="w-4 h-4 text-green-500" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TasksSection({ title, tasks, isDarkMode, onToggle, onEdit, onDelete, onAssignToMe, togglingTask }) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        {title} ({tasks.length})
      </h2>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isDarkMode={isDarkMode}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAssignToMe={onAssignToMe}
          togglingTask={togglingTask}
        />
      ))}
    </div>
  );
}

export default function TasksPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [loading, setLoading] = useState(true);
  const [togglingTask, setTogglingTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [userRole, setUserRole] = useState("");

  // Check if user is Admin or Manager
  const isAdminOrManager = userRole === "ADMIN" || userRole === "MANAGER";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setCurrentUserId(userData.id || "");
        setCurrentUserName(userData.name || "");
        setUserRole(userData.role || "MEMBER");
      } catch {}
    }
  }, []);

  const fetchTasks = async () => {
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
          priority: project.priority,
          startDate: project.startDate.split('T')[0],
          endDate: project.endDate.split('T')[0],
          createdById: project.createdBy?.id,
          tasks: project.tasks.map(task => ({
            id: task.id,
            title: task.title,
            completed: task.completed,
            createdAt: task.createdAt,
            assignedTo: task.assignedTo?.name || null,
            assignedToId: task.assignedTo?.id || null,
          }))
        }));
        setProjects(formattedProjects);
        
        // Flatten all tasks with project info
        const tasks = [];
        formattedProjects.forEach(project => {
          project.tasks.forEach(task => {
            tasks.push({
              ...task,
              projectId: project.id,
              projectTitle: project.title,
              projectStatus: project.status,
              projectPriority: project.priority,
              projectEndDate: project.endDate,
              projectCreatedById: project.createdById,
            });
          });
        });
        setAllTasks(tasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [router]);

  // Filter tasks based on user role
  const getVisibleTasks = () => {
    let tasks = [...allTasks];
    
    // For MEMBER role: only show tasks assigned to them
    if (!isAdminOrManager) {
      tasks = tasks.filter(task => task.assignedTo === currentUserName);
    }
    
    // Apply search filter
    if (search) {
      tasks = tasks.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.projectTitle.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (filterPriority !== "all") {
      tasks = tasks.filter(t => t.projectPriority === filterPriority);
    }
    
    // Apply project filter
    if (filterProject !== "all") {
      tasks = tasks.filter(t => t.projectId === filterProject);
    }
    
    // Apply assignee filter (only for admin/manager)
    if (isAdminOrManager && filterAssignee !== "all") {
      if (filterAssignee === "unassigned") {
        tasks = tasks.filter(t => !t.assignedTo);
      } else {
        tasks = tasks.filter(t => t.assignedTo === filterAssignee);
      }
    }
    
    // Sort: Overdue first, then by priority (HIGH > MEDIUM > LOW), then by due date
    tasks.sort((a, b) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const aDueDate = new Date(a.projectEndDate);
      aDueDate.setHours(0, 0, 0, 0);
      const bDueDate = new Date(b.projectEndDate);
      bDueDate.setHours(0, 0, 0, 0);
      
      const aIsOverdue = !a.completed && aDueDate < today;
      const bIsOverdue = !b.completed && bDueDate < today;
      
      // Overdue tasks come first
      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      
      // If both overdue or both not overdue, sort by priority
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      const aPriority = priorityOrder[a.projectPriority] ?? 1;
      const bPriority = priorityOrder[b.projectPriority] ?? 1;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // If same priority, sort by due date (earliest first)
      return aDueDate - bDueDate;
    });
    
    return tasks;
  };

  const visibleTasks = getVisibleTasks();
  const pendingTasks = visibleTasks.filter(t => !t.completed);
  const completedTasks = visibleTasks.filter(t => t.completed);

  const handleToggleTask = async (taskId, currentStatus) => {
    setTogglingTask(taskId);
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks();
        toast.success(currentStatus ? "Task reopened" : "Task completed!");
      } else {
        toast.error(data.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error toggling task:", error);
      toast.error("Failed to update task");
    } finally {
      setTogglingTask(null);
    }
  };

  const handleEditTask = async (taskId, newTitle, newAssignee) => {
    const token = getAuthToken();
    if (!token) return;

    setIsEditing(true);
    try {
      const response = await fetch(`${API_URL}/api/projects/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, assignee: newAssignee }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks();
        toast.success("Task updated!");
      } else {
        toast.error(data.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks();
        toast.success("Task deleted!");
      } else {
        toast.error(data.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleAssignToMe = async (taskId) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/projects/tasks/${taskId}/assign-to-me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTasks();
        toast.success("Task assigned to you!");
      } else {
        toast.error(data.message || "Failed to assign task");
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    }
  };

  const projectOptions = [
    { value: "all", label: "All Projects" },
    ...projects.map(p => ({ value: p.id, label: p.title })),
  ];

  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  const assigneeOptions = [
    { value: "all", label: "All Assignees" },
    ...teamMembers.map(m => ({ value: m.name, label: m.name })),
    { value: "unassigned", label: "Unassigned" },
  ];

  const sortOptions = [
    { value: "dueDate", label: "Due Date" },
    { value: "title", label: "Title" },
    { value: "project", label: "Project" },
    { value: "priority", label: "Priority" },
  ];

  const totalTasksCount = visibleTasks.length;
  const pendingCount = pendingTasks.length;
  const completedCount = completedTasks.length;

  const activeFiltersCount = [
    filterPriority !== "all", 
    filterProject !== "all", 
    (isAdminOrManager && filterAssignee !== "all"),
    search !== ""
  ].filter(Boolean).length;

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
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Tasks</h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {isAdminOrManager ? "Manage all team tasks" : "Your assigned tasks"}
            </p>
          </div>
          {isAdminOrManager && (
            <button
              onClick={() => router.push("/projects")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-105 shadow-lg"
              style={{ backgroundColor: "#4B0082" }}
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{totalTasksCount}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Tasks</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-green-400">{completedCount}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Completed</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                  isDarkMode 
                    ? "bg-[#252832] border-[#2a2d35] text-white focus:ring-[#4B0082]/50" 
                    : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#4B0082]/50"
                }`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown value={filterPriority} onChange={setFilterPriority} options={priorityOptions} isDarkMode={isDarkMode} icon={AlertCircle} />
              <FilterDropdown value={filterProject} onChange={setFilterProject} options={projectOptions} isDarkMode={isDarkMode} icon={FolderKanban} />
              {isAdminOrManager && (
                <FilterDropdown value={filterAssignee} onChange={setFilterAssignee} options={assigneeOptions} isDarkMode={isDarkMode} icon={UserCheck} />
              )}
              <FilterDropdown value={sortBy} onChange={setSortBy} options={sortOptions} isDarkMode={isDarkMode} />
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterPriority("all");
                    setFilterProject("all");
                    if (isAdminOrManager) setFilterAssignee("all");
                    setSortBy("dueDate");
                  }}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${
                    isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <X className="w-3.5 h-3.5" /> Clear ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {visibleTasks.length === 0 ? (
          <div className={`p-12 rounded-xl border text-center ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              {isAdminOrManager ? "No tasks found" : "No tasks assigned to you"}
            </p>
            {isAdminOrManager && (
              <button
                onClick={() => router.push("/projects")}
                className="mt-4 text-sm font-medium hover:underline"
                style={{ color: "#4B0082" }}
              >
                Create a task from a project →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {pendingTasks.length > 0 && (
              <TasksSection
                title="Pending Tasks"
                tasks={pendingTasks}
                isDarkMode={isDarkMode}
                onToggle={handleToggleTask}
                onEdit={(task) => {
                  setEditingTask(task);
                  setEditingProject(projects.find(p => p.id === task.projectId));
                  setEditModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onAssignToMe={handleAssignToMe}
                togglingTask={togglingTask}
              />
            )}
            
            {completedTasks.length > 0 && (
              <TasksSection
                title="Completed Tasks"
                tasks={completedTasks}
                isDarkMode={isDarkMode}
                onToggle={handleToggleTask}
                onEdit={(task) => {
                  setEditingTask(task);
                  setEditingProject(projects.find(p => p.id === task.projectId));
                  setEditModalOpen(true);
                }}
                onDelete={handleDeleteTask}
                onAssignToMe={handleAssignToMe}
                togglingTask={togglingTask}
              />
            )}
          </div>
        )}
      </div>

      <EditTaskModal
        task={editingTask}
        project={editingProject}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingTask(null);
          setEditingProject(null);
        }}
        onSaveEdit={handleEditTask}
        isDarkMode={isDarkMode}
      />
    </>
  );
}