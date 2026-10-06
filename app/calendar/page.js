"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../../context/ThemeContext";
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ListTodo, FolderKanban, CheckSquare, AlertCircle,
  ChevronDown, X, Plus, Filter
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

// Day names
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
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

export default function CalendarPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const brandColor = isDarkMode ? "#A855F7" : "#4B0082";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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
          description: project.description,
          createdBy: project.createdBy?.name,
          assignee: project.assignee?.name,
        }));
        setProjects(formattedProjects);
        
        // Flatten tasks
        const allTasks = [];
        data.data.forEach(project => {
          project.tasks.forEach(task => {
            allTasks.push({
              id: task.id,
              title: task.title,
              completed: task.completed,
              projectId: project.id,
              projectTitle: project.title,
              projectStatus: project.status,
              projectPriority: project.priority,
              projectEndDate: project.endDate.split('T')[0],
              assignedTo: task.assignedTo?.name,
            });
          });
        });
        setTasks(allTasks);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return { tasks: [], projects: [] };
    
    const dateStr = date.toISOString().split('T')[0];
    
    let dayTasks = tasks.filter(task => {
      if (filterStatus === "completed" && !task.completed) return false;
      if (filterStatus === "pending" && task.completed) return false;
      return task.projectEndDate === dateStr;
    });
    
    let dayProjects = projects.filter(project => {
      if (filterStatus === "completed" && project.status !== "COMPLETED") return false;
      if (filterStatus === "pending" && project.status === "COMPLETED") return false;
      return project.endDate === dateStr;
    });
    
    let items = [];
    if (filterType === "all" || filterType === "tasks") {
      items = [...items, ...dayTasks.map(t => ({ ...t, type: "task" }))];
    }
    if (filterType === "all" || filterType === "projects") {
      items = [...items, ...dayProjects.map(p => ({ ...p, type: "project" }))];
    }
    
    return items;
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const items = getEventsForDate(date);
    setSelectedItems(items);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setSelectedItems([]);
  };

  const changeMonth = (increment) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const filterTypeOptions = [
    { value: "all", label: "All Items" },
    { value: "tasks", label: "Tasks Only" },
    { value: "projects", label: "Projects Only" },
  ];

  const filterStatusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
  ];

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
            <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Calendar</h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              View and manage your tasks and project deadlines
            </p>
          </div>
        </div>

        {/* Filters - Styled like Projects page */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex flex-wrap gap-2">
              <FilterDropdown 
                value={filterType} 
                onChange={setFilterType} 
                options={filterTypeOptions} 
                isDarkMode={isDarkMode} 
                icon={Filter} 
              />
              <FilterDropdown 
                value={filterStatus} 
                onChange={setFilterStatus} 
                options={filterStatusOptions} 
                isDarkMode={isDarkMode} 
                icon={AlertCircle} 
              />
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={goToToday}
                  className={`px-3 py-2 rounded-lg text-sm transition-all hover:scale-105 ${
                    isDarkMode 
                      ? "bg-[#252832] border border-[#2a2d35] text-gray-300 hover:border-[#4B0082]"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#4B0082]"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => changeMonth(-1)}
                  className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode 
                      ? "bg-[#252832] border border-[#2a2d35] text-gray-300 hover:border-[#4B0082]"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#4B0082]"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className={`p-2 rounded-lg transition-all hover:scale-105 ${
                    isDarkMode 
                      ? "bg-[#252832] border border-[#2a2d35] text-gray-300 hover:border-[#4B0082]"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:border-[#4B0082]"
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Header */}
        <div className={`text-center py-3 rounded-xl ${isDarkMode ? "bg-[#1a1c23]" : "bg-white"} border ${isDarkMode ? "border-[#2a2d35]" : "border-gray-200"}`}>
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div
              key={day}
              className={`text-center py-2 text-sm font-medium rounded-lg ${
                isDarkMode ? "text-gray-400 bg-[#1a1c23]" : "text-gray-500 bg-gray-50"
              }`}
            >
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className={`min-h-[100px] rounded-lg ${isDarkMode ? "bg-[#0f0f12]" : "bg-gray-50"}`} />;
            }
            
            const events = getEventsForDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const hasEvents = events.length > 0;
            
            return (
              <div
                key={date.toISOString()}
                onClick={() => handleDateClick(date)}
                className={`min-h-[100px] p-2 rounded-lg border transition-all cursor-pointer hover:border-[#4B0082] ${
                  isDarkMode 
                    ? "bg-[#1a1c23] border-[#2a2d35] hover:bg-[#252832]" 
                    : "bg-white border-gray-200 hover:bg-gray-50"
                } ${isToday ? (isDarkMode ? "ring-2 ring-[#4B0082]" : "ring-2 ring-[#4B0082]") : ""}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium ${isToday ? "text-[#4B0082]" : isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {date.getDate()}
                  </span>
                  {hasEvents && (
                    <span className="w-2 h-2 rounded-full bg-[#4B0082]" />
                  )}
                </div>
                <div className="space-y-1">
                  {events.slice(0, 3).map((event, i) => (
                    <div
                      key={i}
                      className={`text-xs p-1 rounded truncate ${
                        event.type === "task"
                          ? event.completed
                            ? "bg-green-500/10 text-green-400"
                            : "bg-blue-500/10 text-blue-400"
                          : event.status === "COMPLETED"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-purple-500/10 text-purple-400"
                      }`}
                    >
                      {event.type === "task" ? "📋" : "📁"} {event.title}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">
                      +{events.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={`p-4 rounded-xl border flex flex-wrap gap-4 justify-center ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500/20"></div>
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Pending Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/20"></div>
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Completed Task</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500/20"></div>
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Project</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/20"></div>
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Completed Project</span>
          </div>
        </div>
      </div>

      {/* Event Details Modal - Styled like Projects page */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4" onClick={closeModal}>
          <div className={`max-w-md w-full rounded-xl shadow-xl p-6 ${isDarkMode ? "bg-[#1a1c23]" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedItems.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No tasks or projects scheduled for this day
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-all cursor-pointer hover:border-[#4B0082] ${
                      isDarkMode ? "bg-[#252832] border-[#2a2d35]" : "bg-gray-50 border-gray-200"
                    }`}
                    onClick={() => {
                      closeModal();
                      if (item.type === "task") {
                        router.push("/tasks");
                      } else {
                        router.push("/projects");
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {item.type === "task" ? (
                          <ListTodo className="w-4 h-4 text-blue-400" />
                        ) : (
                          <FolderKanban className="w-4 h-4 text-purple-400" />
                        )}
                        <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {item.title}
                        </span>
                      </div>
                      {item.type === "task" ? (
                        item.completed ? (
                          <StatusBadge status="COMPLETED" />
                        ) : (
                          <PriorityBadge priority={item.projectPriority} />
                        )
                      ) : (
                        <StatusBadge status={item.status} />
                      )}
                    </div>
                    {item.type === "task" && (
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Project: {item.projectTitle}
                      </p>
                    )}
                    {item.type === "project" && item.assignee && (
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Assigned to: {item.assignee}
                      </p>
                    )}
                    {item.type === "task" && item.assignedTo && (
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Assigned to: {item.assignedTo}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}