"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { 
  Search, Plus, ChevronDown, Filter, X, 
  Calendar, Clock, MoreVertical,
  FolderKanban, Trash2, Edit2, Archive, RotateCcw,
  Users, Flag, AlertCircle, UserPlus, UserCheck, Save,
  Globe, Lock
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

function VisibilityBadge({ visibility }) {
  if (visibility === "public") {
    return (
      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
        <Globe className="w-3 h-3" />
        Public
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-500/10 text-gray-400">
      <Lock className="w-3 h-3" />
      Private
    </span>
  );
}

function StyledSelect({ value, onChange, options, isDarkMode, placeholder }) {
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
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
          isDarkMode 
            ? "bg-[#252832] border-[#2a2d35] text-white hover:bg-[#2d3038]"
            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
        }`}
      >
        <span className="truncate">{selected?.label || placeholder || "Select"}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 w-full rounded-lg border shadow-lg z-50 overflow-hidden ${
          isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"
        }`}>
          {options.map(option => (
            <button
              key={option.value}
              type="button"
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

function ProjectModal({ project, isOpen, onClose, onSave, isDarkMode, teamMembers, isSaving }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    section: "OTHER",
    visibility: "private",
    assignee: "",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description || "",
        priority: project.priority || "MEDIUM",
        section: project.section || "OTHER",
        visibility: project.visibility || "private",
        assignee: project.assignee || "",
        startDate: project.startDate,
        endDate: project.endDate,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        section: "OTHER",
        visibility: "private",
        assignee: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const priorityOptions = [
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  const sectionOptions = [
    { value: "DEPARTMENT", label: "My Department Projects" },
    { value: "OTHER", label: "Other Projects" },
  ];

  const visibilityOptions = [
    { value: "private", label: "Private - Only me" },
    { value: "public", label: "Public - Everyone can view" },
  ];

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...teamMembers.map(m => ({ value: m.name, label: m.name })),
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Project name is required";
    else if (formData.title.length < 2) newErrors.title = "At least 2 characters";
    else if (formData.title.length > 50) newErrors.title = "Maximum 50 characters";
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Maximum 500 characters";
    }
    
    if (!formData.startDate) newErrors.startDate = "Start date required";
    if (!formData.endDate) newErrors.endDate = "End date required";
    
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = "End date must be after start date";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      const submitData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        section: formData.section,
        visibility: formData.visibility,
        assignee: formData.assignee,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };
      onSave(submitData);
    }
  };

  if (!isOpen) return null;

  const inputClass = (hasError) => `w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${
    hasError 
      ? "border-red-500 focus:ring-red-500/50" 
      : isDarkMode
        ? "bg-[#252832] border-[#2a2d35] text-white focus:ring-[#4B0082]/50 focus:border-[#4B0082]"
        : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#4B0082]/50 focus:border-[#4B0082]"
  }`;

  const dateInputClass = (hasError) => `w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
    hasError 
      ? "border-red-500 focus:ring-red-500/50" 
      : isDarkMode
        ? "bg-[#252832] border-[#2a2d35] text-white focus:ring-[#4B0082]/50 focus:border-[#4B0082] [&::-webkit-calendar-picker-indicator]:invert"
        : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#4B0082]/50 focus:border-[#4B0082]"
  }`;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className={`max-w-md w-full rounded-xl shadow-xl p-6 ${isDarkMode ? "bg-[#1a1c23]" : "bg-white"}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {project ? "Edit Project" : "Create New Project"}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputClass(errors.title)}
            />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputClass(errors.description)} resize-none`}
            />
            {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Priority
              </label>
              <StyledSelect
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
                options={priorityOptions}
                isDarkMode={isDarkMode}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Section
              </label>
              <StyledSelect
                value={formData.section}
                onChange={(val) => setFormData({ ...formData, section: val })}
                options={sectionOptions}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Visibility
              </label>
              <StyledSelect
                value={formData.visibility}
                onChange={(val) => setFormData({ ...formData, visibility: val })}
                options={visibilityOptions}
                isDarkMode={isDarkMode}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Assignee
              </label>
              <StyledSelect
                value={formData.assignee}
                onChange={(val) => setFormData({ ...formData, assignee: val })}
                options={assigneeOptions}
                isDarkMode={isDarkMode}
                placeholder="Assign to..."
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={dateInputClass(errors.startDate)}
              />
              {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={dateInputClass(errors.endDate)}
              />
              {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#4B0082" }}
          >
            {isSaving ? "Creating..." : (project ? "Save Changes" : "Create Project")}
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

function TaskItem({ task, onToggle, onEdit, onDelete, onAssignToMe, isDarkMode, canEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editAssignee, setEditAssignee] = useState(task.assignedTo);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) setAssigneeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onEdit(task.id, editTitle, editAssignee);
      setIsEditing(false);
    }
  };

  const handleToggle = () => {
    if (canEdit) {
      onToggle(task.id);
    }
  };

  const handleDeleteClick = () => {
    if (canEdit) {
      onDelete(task.id);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className={`flex-1 text-sm px-2 py-1 rounded border focus:outline-none focus:ring-1 ${
            isDarkMode ? "bg-[#252832] border-[#2a2d35] text-white" : "bg-gray-50 border-gray-200 text-gray-900"
          }`}
          autoFocus
        />
        <div className="relative" ref={assigneeRef}>
          <button
            type="button"
            onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
            className={`text-sm px-2 py-1 rounded border flex items-center gap-1 ${
              isDarkMode 
                ? "bg-[#252832] border-[#2a2d35] text-white"
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span className="max-w-[70px] truncate">{editAssignee || "Unassigned"}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${assigneeDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {assigneeDropdownOpen && (
            <div className={`absolute top-full left-0 mt-1 w-32 rounded-lg border shadow-lg z-50 overflow-hidden ${
              isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"
            }`}>
              <button
                type="button"
                onClick={() => { setEditAssignee(""); setAssigneeDropdownOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                  !editAssignee
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
                  onClick={() => { setEditAssignee(member.name); setAssigneeDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                    editAssignee === member.name
                      ? isDarkMode ? "bg-[#4B0082]/20 text-[#4B0082]" : "bg-purple-50 text-[#4B0082]"
                      : isDarkMode ? "text-gray-300 hover:bg-[#252832]" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleSaveEdit} className="p-1 rounded hover:bg-green-500/20 text-green-500">
          <Save className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setIsEditing(false)} className="p-1 rounded hover:bg-red-500/20 text-red-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      <label className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggle}
          className="peer w-3.5 h-3.5 opacity-0 absolute cursor-pointer"
        />
        <div className="w-3.5 h-3.5 rounded border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center peer-checked:bg-[#4B0082] peer-checked:border-[#4B0082] peer-checked:text-white transition-all">
          {task.completed && (
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </label>
      <span className={`text-sm flex-1 ${task.completed ? "line-through opacity-50" : ""} ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
        {task.title}
      </span>
      <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
        {task.assignedTo || "Unassigned"}
      </span>
      {canEdit && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={handleEditClick} className="p-0.5 rounded hover:bg-purple-500/20">
            <Edit2 className="w-3 h-3" style={{ color: "#4B0082" }} />
          </button>
          <button onClick={handleDeleteClick} className="p-0.5 rounded hover:bg-red-500/20">
            <Trash2 className="w-3 h-3 text-red-400" />
          </button>
          <button 
            onClick={() => onAssignToMe(task.id)} 
            className="p-0.5 rounded hover:bg-green-500/20"
            title="Assign to me"
          >
            <UserCheck className="w-3 h-3 text-green-500" />
          </button>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, isDarkMode, currentUserId, currentUserName, userRole, teamMembers, onEdit, onDelete, onArchive, onRestore, onAssignToMe, onAddTask, onEditTask, onDeleteTask, onToggleTask, onAssignTaskToMe }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const menuRef = useRef(null);
  const assigneeRef = useRef(null);
  const isOwner = project.createdById === currentUserId;
  const isAdmin = userRole === "ADMIN";
  const canManageTasks = (project.visibility === "public" && (userRole === "MANAGER" || userRole === "ADMIN")) || isOwner;
  const canEditProject = isOwner || (isAdmin && project.visibility === "public");
  const canEdit = canEditProject || canManageTasks;
  const showMenu = canEditProject;
  
  const progress = project.tasks.length > 0 
    ? Math.round((project.tasks.filter(t => t.completed).length / project.tasks.length) * 100) 
    : 0;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (assigneeRef.current && !assigneeRef.current.contains(e.target)) setAssigneeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddTask = () => {
    if (newTaskTitle.trim() && canEdit) {
      onAddTask(project.id, newTaskTitle, newTaskAssignee);
      setNewTaskTitle("");
      setNewTaskAssignee("");
    }
  };

  return (
    <div className={`p-4 rounded-xl border transition-all hover:shadow-lg ${
      isDarkMode 
        ? "bg-[#1a1c23] border-[#2a2d35] hover:border-[#4B0082]" 
        : "bg-white border-gray-200 hover:border-[#4B0082]"
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-1">
          <FolderKanban className="w-5 h-5 shrink-0" style={{ color: "#4B0082" }} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{project.title}</h3>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              <VisibilityBadge visibility={project.visibility} />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                Created by {project.createdBy} • {new Date(project.createdAt).toLocaleDateString()}
              </p>
              {project.assignee && (
                <div className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3" style={{ color: "#4B0082" }} />
                  <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {project.assignee}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {showMenu && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className={`p-1 rounded-lg ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className={`absolute right-0 mt-1 w-36 rounded-lg shadow-lg border overflow-hidden z-10 ${
                isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"
              }`}>
                <button onClick={() => { onEdit(project); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-purple-500/10">
                  <Edit2 className="w-3.5 h-3.5" style={{ color: "#4B0082" }} /> Edit
                </button>
                <button onClick={() => { onAssignToMe(project.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-purple-500/10">
                  <UserPlus className="w-3.5 h-3.5" style={{ color: "#4B0082" }} /> Assign to Me
                </button>
                {!project.archived ? (
                  <button onClick={() => { onArchive(project.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-purple-500/10">
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                ) : (
                  <button onClick={() => { onRestore(project.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-purple-500/10">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore
                  </button>
                )}
                <button onClick={() => { onDelete(project.id); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className={`text-sm mb-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{project.description}</p>

      <div className="flex items-center gap-4 text-xs mb-3">
        <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          <Calendar className="w-3 h-3" />
          <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
        </div>
        <div className={`flex items-center gap-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
          <Clock className="w-3 h-3" />
          <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Progress</span>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{progress}% ({project.tasks.filter(t => t.completed).length}/{project.tasks.length} tasks)</span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: "#4B0082" }} />
        </div>
      </div>

      <div className="border-t pt-3 mt-2" style={{ borderColor: isDarkMode ? "#2a2d35" : "#e5e7eb" }}>
        <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full text-sm mb-2">
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
            Tasks ({project.tasks.filter(t => t.completed).length}/{project.tasks.length})
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="space-y-1 mt-2">
            {project.tasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={(taskId) => onToggleTask(project.id, taskId)}
                onEdit={(taskId, newTitle, newAssignee) => onEditTask(project.id, taskId, newTitle, newAssignee)}
                onDelete={(taskId) => onDeleteTask(project.id, taskId)}
                onAssignToMe={(taskId) => onAssignTaskToMe(project.id, taskId)}
                isDarkMode={isDarkMode} 
                canEdit={canEdit}
              />
            ))}
            
            {canEdit && (
              <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: isDarkMode ? "#2a2d35" : "#e5e7eb" }}>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="Add a task..."
                  className={`flex-1 text-sm px-2 py-1.5 rounded border focus:outline-none focus:ring-1 ${
                    isDarkMode ? "bg-[#252832] border-[#2a2d35] text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                />
                
                <div className="relative" ref={assigneeRef}>
                  <button
                    type="button"
                    onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                    className={`text-sm px-2 py-1.5 rounded border focus:outline-none flex items-center gap-1 ${
                      isDarkMode 
                        ? "bg-[#252832] border-[#2a2d35] text-white hover:bg-[#2d3038]"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span className="max-w-[80px] truncate">{newTaskAssignee || "Assign to..."}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${assigneeDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {assigneeDropdownOpen && (
                    <div className={`absolute top-full left-0 mt-1 w-36 rounded-lg border shadow-lg z-50 overflow-hidden ${
                      isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"
                    }`}>
                      <button
                        type="button"
                        onClick={() => { setNewTaskAssignee(""); setAssigneeDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                          !newTaskAssignee
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
                          onClick={() => { setNewTaskAssignee(member.name); setAssigneeDropdownOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center gap-2 ${
                            newTaskAssignee === member.name
                              ? isDarkMode ? "bg-[#4B0082]/20 text-[#4B0082]" : "bg-purple-50 text-[#4B0082]"
                              : isDarkMode ? "text-gray-300 hover:bg-[#252832]" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                            isDarkMode ? "bg-[#252832] text-gray-300" : "bg-gray-200 text-gray-600"
                          }`}>
                            {member.avatar}
                          </div>
                          <span className="truncate">{member.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={handleAddTask} className="px-3 py-1.5 rounded text-white text-xs" style={{ backgroundColor: "#4B0082" }}>
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectsSection({ title, projects, isDarkMode, currentUserId, currentUserName, userRole, teamMembers, onEdit, onDelete, onArchive, onRestore, onAssignToMe, onAddTask, onEditTask, onDeleteTask, onToggleTask, onAssignTaskToMe }) {
  if (projects.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {projects.map(project => (
          <ProjectCard 
            key={project.id} 
            project={project} 
            isDarkMode={isDarkMode}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            userRole={userRole}
            teamMembers={teamMembers}
            onEdit={onEdit} 
            onDelete={onDelete} 
            onArchive={onArchive} 
            onRestore={onRestore} 
            onAssignToMe={onAssignToMe}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onToggleTask={onToggleTask}
            onAssignTaskToMe={onAssignTaskToMe}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "", id: null, projectId: null });
  
  const brandColor = isDarkMode ? "#A855F7" : "#4B0082";

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setCurrentUserId(user.id || "");
        setCurrentUserName(user.name || "");
        setUserRole(user.role || "MEMBER");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      const token = getAuthToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          const formattedProjects = data.data.map(project => ({
            id: project.id,
            title: project.title,
            description: project.description || "",
            status: project.status,
            priority: project.priority,
            section: project.section,
            visibility: project.visibility || "private",
            assignee: project.assignee?.name || null,
            startDate: project.startDate.split('T')[0],
            endDate: project.endDate.split('T')[0],
            archived: project.archived,
            createdBy: project.createdBy?.name || "Unknown",
            createdById: project.createdBy?.id,
            createdAt: project.createdAt.split('T')[0],
            tasks: project.tasks.map(task => ({
              id: task.id,
              title: task.title,
              completed: task.completed,
              assignedTo: task.assignedTo?.name || null
            }))
          }));
          setProjects(formattedProjects);
        } else {
          console.error("Failed to fetch projects:", data.message);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [router]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
    { value: "OVERDUE", label: "Overdue" },
    { value: "PLANNING", label: "Planning" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priority" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];

  const sectionOptions = [
    { value: "all", label: "All Sections" },
    { value: "DEPARTMENT", label: "My Department" },
    { value: "OTHER", label: "Other Projects" },
  ];

  const visibilityOptions = [
    { value: "all", label: "All Visibility" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  const assigneeOptions = [
    { value: "all", label: "All Assignees" },
    ...teamMembers.map(m => ({ value: m.name, label: m.name })),
    { value: "unassigned", label: "Unassigned" },
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest" },
    { value: "progress", label: "Progress" },
    { value: "name", label: "Name" },
  ];

  let filtered = projects.filter(p => p.archived === showArchived);
  
  if (search) filtered = filtered.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));
  if (filterStatus !== "all") filtered = filtered.filter(p => p.status === filterStatus);
  if (filterPriority !== "all") filtered = filtered.filter(p => p.priority === filterPriority);
  if (filterSection !== "all") filtered = filtered.filter(p => p.section === filterSection);
  if (filterVisibility !== "all") filtered = filtered.filter(p => p.visibility === filterVisibility);
  if (filterAssignee === "unassigned") filtered = filtered.filter(p => !p.assignee);
  else if (filterAssignee !== "all") filtered = filtered.filter(p => p.assignee === filterAssignee);

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "recent": return new Date(b.createdAt) - new Date(a.createdAt);
      case "oldest": return new Date(a.createdAt) - new Date(b.createdAt);
      case "name": return a.title.localeCompare(b.title);
      case "progress":
        const pa = a.tasks.length > 0 ? a.tasks.filter(t => t.completed).length / a.tasks.length : 0;
        const pb = b.tasks.length > 0 ? b.tasks.filter(t => t.completed).length / b.tasks.length : 0;
        return pb - pa;
      default: return 0;
    }
  });

  const myPrivateProjects = filtered.filter(p => p.createdById === currentUserId && p.visibility === "private");
  const myPublicProjects = filtered.filter(p => p.createdById === currentUserId && p.visibility === "public");
  const otherPublicProjects = filtered.filter(p => p.createdById !== currentUserId && p.visibility === "public");
  const otherPrivateProjects = filtered.filter(p => p.createdById !== currentUserId && p.visibility === "private");

  const activeProjects = projects.filter(p => !p.archived);
  
  // Calculate overdue based on endDate
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const totalProjects = activeProjects.length;
  const completedProjects = activeProjects.filter(p => p.status === "COMPLETED").length;
  const inProgressProjects = activeProjects.filter(p => p.status === "IN_PROGRESS").length;
  
  const overdueProjects = activeProjects.filter(p => {
    if (p.status === "COMPLETED") return false;
    const endDate = new Date(p.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  }).length;
  
  const stats = {
    total: totalProjects,
    completed: completedProjects,
    inProgress: inProgressProjects,
    overdue: overdueProjects,
  };

  const handleCreateProject = async (formData) => {
    if (isCreating) return;
    
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newProject = {
          id: data.data.id,
          title: data.data.title,
          description: data.data.description || "",
          status: data.data.status,
          priority: data.data.priority,
          section: data.data.section,
          visibility: data.data.visibility || "private",
          assignee: data.data.assignee?.name || null,
          startDate: data.data.startDate.split('T')[0],
          endDate: data.data.endDate.split('T')[0],
          archived: data.data.archived,
          createdBy: data.data.createdBy?.name || "You",
          createdById: data.data.createdBy?.id,
          createdAt: data.data.createdAt.split('T')[0],
          tasks: [],
        };
        setProjects([newProject, ...projects]);
        setModalOpen(false);
        toast.success("Project created successfully!");
      } else {
        toast.error(data.message || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditProject = async (formData) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/${editingProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const updatedProject = {
          ...editingProject,
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          section: formData.section,
          visibility: formData.visibility,
          assignee: formData.assignee || null,
          startDate: formData.startDate,
          endDate: formData.endDate,
        };
        
        setProjects(projects.map(p => 
          p.id === editingProject.id ? updatedProject : p
        ));
        setEditingProject(null);
        setModalOpen(false);
        toast.success("Project updated successfully!");
      } else {
        toast.error(data.message || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    }
  };

  const handleDeleteProject = (id) => {
    setConfirmModal({ isOpen: true, type: "deleteProject", id: id, projectId: null });
  };

  const handleConfirmDeleteProject = async (id) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(projects.filter(p => p.id !== id));
        toast.success("Project deleted successfully!");
      } else {
        toast.error(data.message || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleArchiveProject = (id) => {
    setConfirmModal({ isOpen: true, type: "archiveProject", id: id, projectId: null });
  };

  const handleConfirmArchiveProject = async (id) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archived: true }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(projects.map(p => p.id === id ? { ...p, archived: true } : p));
        toast.success("Project archived!");
      } else {
        toast.error(data.message || "Failed to archive project");
      }
    } catch (error) {
      console.error("Error archiving project:", error);
      toast.error("Failed to archive project");
    }
  };

  const handleRestoreProject = (id) => {
    setConfirmModal({ isOpen: true, type: "restoreProject", id: id, projectId: null });
  };

  const handleConfirmRestoreProject = async (id) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archived: false }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(projects.map(p => p.id === id ? { ...p, archived: false } : p));
        toast.success("Project restored!");
      } else {
        toast.error(data.message || "Failed to restore project");
      }
    } catch (error) {
      console.error("Error restoring project:", error);
      toast.error("Failed to restore project");
    }
  };

  const handleAssignProjectToMe = async (projectId) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/assign-to-me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(projects.map(p => 
          p.id === projectId ? { ...p, assignee: currentUserName } : p
        ));
        toast.success("Project assigned to you!");
      } else {
        toast.error(data.message || "Failed to assign project");
      }
    } catch (error) {
      console.error("Error assigning project:", error);
      toast.error("Failed to assign project");
    }
  };

  const handleAssignTaskToMe = async (projectId, taskId) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

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
        setProjects(projects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.map(t => 
                t.id === taskId ? { ...t, assignedTo: currentUserName } : t
              )
            };
          }
          return p;
        }));
        toast.success("Task assigned to you!");
      } else {
        toast.error(data.message || "Failed to assign task");
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task");
    }
  };

  const handleAddTask = async (projectId, taskTitle, assignee) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const payload = { title: taskTitle };
    if (assignee && assignee.trim() !== "") {
      payload.assignee = assignee;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newTask = {
          id: data.data.id,
          title: data.data.title,
          completed: false,
          assignedTo: data.data.assignedTo?.name || assignee || null,
        };
        
        setProjects(projects.map(p => {
          if (p.id === projectId) {
            return { ...p, tasks: [...p.tasks, newTask] };
          }
          return p;
        }));
        toast.success("Task added!");
      } else if (data.message === "You don't have permission to add tasks to this project") {
        toast.error("You don't have permission to add tasks to this project");
      } else {
        toast.error(data.message || "Failed to add task");
      }
    } catch (error) {
      console.error("Error adding task:", error);
      toast.error("Failed to add task");
    }
  };

  const handleEditTask = async (projectId, taskId, newTitle, newAssignee) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

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
        setProjects(projects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              tasks: p.tasks.map(t => 
                t.id === taskId ? { ...t, title: newTitle, assignedTo: newAssignee } : t
              )
            };
          }
          return p;
        }));
        toast.success("Task updated!");
      } else if (data.message === "You don't have permission to update tasks in this project") {
        toast.error("You don't have permission to edit tasks in this project");
      } else {
        toast.error(data.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = (projectId, taskId) => {
    setConfirmModal({ isOpen: true, type: "deleteTask", id: taskId, projectId: projectId });
  };

  const handleConfirmDeleteTask = async (projectId, taskId) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/projects/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(projects.map(p => {
          if (p.id === projectId) {
            return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
          }
          return p;
        }));
        toast.success("Task deleted!");
      } else if (data.message === "You don't have permission to delete tasks in this project") {
        toast.error("You don't have permission to delete tasks in this project");
      } else {
        toast.error(data.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleToggleTask = async (projectId, taskId) => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    const project = projects.find(p => p.id === projectId);
    const task = project?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedStatus = !task.completed;

    try {
      const response = await fetch(`${API_URL}/api/projects/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: newCompletedStatus }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(projects.map(p => {
          if (p.id === projectId) {
            const updatedTasks = p.tasks.map(t => 
              t.id === taskId ? { ...t, completed: newCompletedStatus } : t
            );
            const allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
            const newStatus = allCompleted ? "COMPLETED" : p.status === "COMPLETED" ? "IN_PROGRESS" : p.status;
            return { ...p, tasks: updatedTasks, status: newStatus };
          }
          return p;
        }));
        toast.success(newCompletedStatus ? "Task completed!" : "Task reopened");
      } else if (data.message === "You don't have permission to update tasks in this project") {
        toast.error("You don't have permission to update tasks in this project");
      } else {
        toast.error(data.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error toggling task:", error);
      toast.error("Failed to update task");
    }
  };

  const activeFiltersCount = [
    filterStatus !== "all", filterPriority !== "all", filterSection !== "all", filterVisibility !== "all", filterAssignee !== "all", search !== ""
  ].filter(Boolean).length;

  const titles = {
    deleteProject: "Delete Project",
    deleteTask: "Delete Task",
    archiveProject: "Archive Project",
    restoreProject: "Restore Project"
  };
  
  const messages = {
    deleteProject: "Are you sure you want to delete this project? This action cannot be undone.",
    deleteTask: "Are you sure you want to delete this task? This action cannot be undone.",
    archiveProject: "Are you sure you want to archive this project?",
    restoreProject: "Are you sure you want to restore this project?"
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Projects</h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Manage and track all your projects</p>
          </div>
          <button onClick={() => { setEditingProject(null); setModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-105 shadow-lg" style={{ backgroundColor: "#4B0082" }}>
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.total}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Projects</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>In Progress</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Completed</p>
          </div>
          <div className={`p-3 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <p className="text-2xl font-bold text-red-400">{stats.overdue}</p>
            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Overdue</p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <button onClick={() => setShowArchived(!showArchived)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${showArchived ? isDarkMode ? "bg-[#4B0082] text-[#A855F7]" : "bg-purple-100 text-[#4B0082]" : isDarkMode ? "bg-[#1a1c23] text-gray-400 hover:text-white" : "bg-gray-100 text-gray-600 hover:text-gray-900"}`}>
            {showArchived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
            {showArchived ? "Show Active Projects" : "Show Archived Projects"}
          </button>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className={`w-full pl-9 pr-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${isDarkMode ? "bg-[#252832] border-[#2a2d35] text-white focus:ring-[#4B0082]/50" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#4B0082]/50"}`} />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={statusOptions} isDarkMode={isDarkMode} icon={Filter} />
              <FilterDropdown value={filterPriority} onChange={setFilterPriority} options={priorityOptions} isDarkMode={isDarkMode} icon={Flag} />
              <FilterDropdown value={filterSection} onChange={setFilterSection} options={sectionOptions} isDarkMode={isDarkMode} icon={Users} />
              <FilterDropdown value={filterVisibility} onChange={setFilterVisibility} options={visibilityOptions} isDarkMode={isDarkMode} icon={Globe} />
              <FilterDropdown value={filterAssignee} onChange={setFilterAssignee} options={assigneeOptions} isDarkMode={isDarkMode} icon={UserPlus} />
              <FilterDropdown value={sortBy} onChange={setSortBy} options={sortOptions} isDarkMode={isDarkMode} />
              {activeFiltersCount > 0 && (
                <button onClick={() => { setSearch(""); setFilterStatus("all"); setFilterPriority("all"); setFilterSection("all"); setFilterVisibility("all"); setFilterAssignee("all"); setSortBy("recent"); }} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}>
                  <X className="w-3.5 h-3.5" /> Clear ({activeFiltersCount})
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{filtered.length} project{filtered.length !== 1 ? "s" : ""} found</div>

        {filtered.length === 0 ? (
          <div className={`p-12 rounded-xl border text-center ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              {showArchived ? "No archived projects found" : "No projects found"}
            </p>
          </div>
        ) : (
          <>
            <ProjectsSection 
              title="Your Private Projects"
              projects={myPrivateProjects}
              isDarkMode={isDarkMode}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              userRole={userRole}
              teamMembers={teamMembers}
              onEdit={(p) => { setEditingProject(p); setModalOpen(true); }}
              onDelete={handleDeleteProject}
              onArchive={handleArchiveProject}
              onRestore={handleRestoreProject}
              onAssignToMe={handleAssignProjectToMe}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onAssignTaskToMe={handleAssignTaskToMe}
            />
            
            <ProjectsSection 
              title="Your Public Projects"
              projects={myPublicProjects}
              isDarkMode={isDarkMode}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              userRole={userRole}
              teamMembers={teamMembers}
              onEdit={(p) => { setEditingProject(p); setModalOpen(true); }}
              onDelete={handleDeleteProject}
              onArchive={handleArchiveProject}
              onRestore={handleRestoreProject}
              onAssignToMe={handleAssignProjectToMe}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onAssignTaskToMe={handleAssignTaskToMe}
            />
            
            <ProjectsSection 
              title="Public Projects from Others"
              projects={otherPublicProjects}
              isDarkMode={isDarkMode}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              userRole={userRole}
              teamMembers={teamMembers}
              onEdit={(p) => { setEditingProject(p); setModalOpen(true); }}
              onDelete={handleDeleteProject}
              onArchive={handleArchiveProject}
              onRestore={handleRestoreProject}
              onAssignToMe={handleAssignProjectToMe}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onAssignTaskToMe={handleAssignTaskToMe}
            />
            
            <ProjectsSection 
              title="Private Projects from Others"
              projects={otherPrivateProjects}
              isDarkMode={isDarkMode}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              userRole={userRole}
              teamMembers={teamMembers}
              onEdit={(p) => { setEditingProject(p); setModalOpen(true); }}
              onDelete={handleDeleteProject}
              onArchive={handleArchiveProject}
              onRestore={handleRestoreProject}
              onAssignToMe={handleAssignProjectToMe}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTask={handleToggleTask}
              onAssignTaskToMe={handleAssignTaskToMe}
            />
          </>
        )}
      </div>

      {modalOpen && (
        <ProjectModal 
          project={editingProject} 
          isOpen={modalOpen} 
          onClose={() => { setModalOpen(false); setEditingProject(null); }} 
          onSave={editingProject ? handleEditProject : handleCreateProject} 
          isDarkMode={isDarkMode}
          teamMembers={teamMembers}
          isSaving={isCreating}
        />
      )}

      {confirmModal.isOpen && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className={`max-w-md w-full rounded-xl shadow-xl p-6 ${isDarkMode ? "bg-[#1a1c23]" : "bg-white"}`}>
            <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {titles[confirmModal.type]}
            </h2>
            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {messages[confirmModal.type]}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (confirmModal.type === "deleteProject") {
                    handleConfirmDeleteProject(confirmModal.id);
                  } else if (confirmModal.type === "deleteTask") {
                    handleConfirmDeleteTask(confirmModal.projectId, confirmModal.id);
                  } else if (confirmModal.type === "archiveProject") {
                    handleConfirmArchiveProject(confirmModal.id);
                  } else if (confirmModal.type === "restoreProject") {
                    handleConfirmRestoreProject(confirmModal.id);
                  }
                  setConfirmModal({ isOpen: false, type: "", id: null, projectId: null });
                }}
                className="flex-1 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: "#ef4444" }}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmModal({ isOpen: false, type: "", id: null, projectId: null })}
                className={`flex-1 py-2 rounded-lg border font-medium transition-all ${
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