"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, CheckSquare, TrendingUp, Clock, AlertCircle, ArrowRight, Eye, ListTodo, UserCheck, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default function DashboardPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    totalTasks: 0,
    completedTasks: 0,
    myTasksCount: 0,
    myProjectsCount: 0,
  });
  const [activity, setActivity] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingTask, setTogglingTask] = useState(null);
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState({});

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch {}
    }
  }, []);

  const handleToggleTask = async (taskId, projectId, currentStatus) => {
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
        setMyTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, completed: !currentStatus } : task
        ));
        fetchProjectsData();
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    } finally {
      setTogglingTask(null);
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

  const getEventsForDate = (date, allProjects, allTasks) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    
    const dayTasks = allTasks.filter(task => task.projectEndDate === dateStr);
    const dayProjects = allProjects.filter(project => project.endDate === dateStr);
    
    return dayTasks.length + dayProjects.length;
  };

  const fetchProjectsData = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await response.json();
      
      if (data.success) {
        const stored = localStorage.getItem("user");
        let currentUserId = null;
        let currentUserName = null;
        if (stored) {
          try {
            const userData = JSON.parse(stored);
            currentUserId = userData.id;
            currentUserName = userData.name;
          } catch {}
        }
        
        const formattedProjects = data.data.map(project => ({
          id: project.id,
          title: project.title,
          status: project.status,
          startDate: project.startDate.split('T')[0],
          endDate: project.endDate.split('T')[0],
          assignee: project.assignee?.name || null,
          assigneeId: project.assignee?.id || null,
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
        
        // Flatten all tasks for calendar
        const allTasks = [];
        formattedProjects.forEach(project => {
          project.tasks.forEach(task => {
            allTasks.push({
              ...task,
              projectTitle: project.title,
              projectEndDate: project.endDate,
            });
          });
        });
        
        // Update calendar events (just count, not full events)
        const days = getDaysInMonth(calendarDate);
        const events = {};
        days.forEach(day => {
          if (day) {
            const dateStr = day.toISOString().split('T')[0];
            const eventCount = getEventsForDate(day, formattedProjects, allTasks);
            events[dateStr] = eventCount;
          }
        });
        setCalendarEvents(events);
        
        // My Projects - assigned to current user OR created by current user
        const assignedProjects = formattedProjects.filter(p => 
          p.assigneeId === currentUserId || 
          p.assignee === currentUserName ||
          p.createdById === currentUserId
        );
        setMyProjects(assignedProjects.slice(0, 2));
        
        // My Tasks - assigned to current user and not completed
        const userTasks = [];
        formattedProjects.forEach(project => {
          project.tasks.forEach(task => {
            const isAssignedToUser = task.assignedToId === currentUserId || task.assignedTo === currentUserName;
            if (isAssignedToUser && !task.completed) {
              userTasks.push({
                id: task.id,
                title: task.title,
                projectId: project.id,
                projectTitle: project.title,
                completed: task.completed,
                dueDate: project.endDate,
              });
            }
          });
        });
        setMyTasks(userTasks.slice(0, 5));
        
        // Stats - calculate overdue based on endDate
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const totalProjects = formattedProjects.length;
        const completedProjects = formattedProjects.filter(p => p.status === "COMPLETED").length;
        const inProgressProjects = formattedProjects.filter(p => p.status === "IN_PROGRESS").length;
        
        // Calculate overdue: not completed AND endDate < today
        const overdueProjects = formattedProjects.filter(p => {
          if (p.status === "COMPLETED") return false;
          const endDate = new Date(p.endDate);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today;
        }).length;
        
        const allTasksFlat = formattedProjects.flatMap(p => p.tasks);
        const totalTasks = allTasksFlat.length;
        const completedTasks = allTasksFlat.filter(t => t.completed).length;
        
        setStats({
          total: totalProjects,
          completed: completedProjects,
          inProgress: inProgressProjects,
          overdue: overdueProjects,
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          myTasksCount: userTasks.length,
          myProjectsCount: assignedProjects.length,
        });
        
        // Recent activity
        const recentTasks = allTasksFlat
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
          .map(task => {
            const project = formattedProjects.find(p => p.tasks.some(t => t.id === task.id));
            return {
              text: `${task.completed ? "✓ Completed" : "+ Added"} "${task.title}"`,
              project: project?.title,
              time: new Date(task.createdAt).toLocaleDateString(),
              completed: task.completed,
            };
          });
        setActivity(recentTasks);
        
        // Upcoming deadlines - exclude completed projects
        const upcomingDeadlines = formattedProjects
          .filter(p => p.status !== "COMPLETED")
          .map(project => {
            const endDate = new Date(project.endDate);
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);
            
            const diffTime = endDate - todayDate;
            const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(t => t.completed).length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            let statusText = "";
            if (daysLeft < 0) {
              statusText = "Overdue";
            } else if (daysLeft === 0) {
              statusText = "Today";
            } else if (daysLeft === 1) {
              statusText = "Tomorrow";
            } else {
              statusText = `${daysLeft}d`;
            }
            
            return {
              id: project.id,
              title: project.title,
              endDate: project.endDate,
              daysLeft: daysLeft,
              status: statusText,
              urgent: daysLeft <= 3 && daysLeft >= 0,
              overdue: daysLeft < 0,
              progress: progress,
              isAssignedToMe: project.assigneeId === currentUserId || project.assignee === currentUserName,
            };
          })
          .sort((a, b) => {
            if (a.overdue && !b.overdue) return -1;
            if (!a.overdue && b.overdue) return 1;
            return a.daysLeft - b.daysLeft;
          })
          .slice(0, 2);
        setDeadlines(upcomingDeadlines);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsData();
  }, [router, user]);

  useEffect(() => {
    // Refresh calendar when month changes
    if (projects.length > 0) {
      const allTasks = [];
      projects.forEach(project => {
        project.tasks.forEach(task => {
          allTasks.push({
            ...task,
            projectTitle: project.title,
            projectEndDate: project.endDate,
          });
        });
      });
      
      const days = getDaysInMonth(calendarDate);
      const events = {};
      days.forEach(day => {
        if (day) {
          const dateStr = day.toISOString().split('T')[0];
          const eventCount = getEventsForDate(day, projects, allTasks);
          events[dateStr] = eventCount;
        }
      });
      setCalendarEvents(events);
    }
  }, [calendarDate, projects]);

  const changeMonth = (increment) => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + increment, 1));
  };

  const goToToday = () => {
    setCalendarDate(new Date());
  };

  const days = getDaysInMonth(calendarDate);
  const currentMonth = calendarDate.getMonth();
  const currentYear = calendarDate.getFullYear();

  const brandColor = isDarkMode ? "#A855F7" : "#4B0082";

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#4B0082] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4">
      
      {/* Welcome Banner */}
      <div 
        className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: "#4B0082" }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">
            Welcome back, {user?.name?.split(" ")[0] || "there"}
          </h2>
          <p className="text-sm text-white/80 mt-1">
            You have {stats.myTasksCount} tasks and {stats.myProjectsCount} projects assigned to you
          </p>
        </div>
        <button
          onClick={() => router.push("/projects")}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-sm font-medium px-4 py-2 rounded-lg transition-all hover:scale-105"
          style={{ color: "#4B0082" }}
        >
          View Projects <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode
            ? "bg-[#1a1c23] border-[#2a2d35] hover:border-[#A855F7] hover:shadow-lg hover:shadow-[#A855F7]/20"
            : "bg-white border-gray-100 hover:border-[#4B0082] hover:shadow-lg hover:shadow-[#4B0082]/20"
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${isDarkMode ? "bg-[#252832]" : "bg-gray-100"}`}>
            <FolderKanban className="w-4.5 h-4.5" style={{ color: brandColor }} />
          </div>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.total}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Projects</p>
          <p className="text-xs font-semibold mt-1.5" style={{ color: brandColor }}>{stats.completed} completed</p>
        </div>
        
        <div className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode
            ? "bg-[#1a1c23] border-[#2a2d35] hover:border-[#A855F7]"
            : "bg-white border-gray-100 hover:border-[#4B0082]"
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${isDarkMode ? "bg-[#252832]" : "bg-gray-100"}`}>
            <CheckSquare className="w-4.5 h-4.5" style={{ color: brandColor }} />
          </div>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.completedTasks}/{stats.totalTasks}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Tasks done</p>
          <p className="text-xs font-semibold mt-1.5" style={{ color: brandColor }}>{stats.totalTasks - stats.completedTasks} remaining</p>
        </div>
        
        <div className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode
            ? "bg-[#1a1c23] border-[#2a2d35] hover:border-[#A855F7]"
            : "bg-white border-gray-100 hover:border-[#4B0082]"
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${isDarkMode ? "bg-[#252832]" : "bg-gray-100"}`}>
            <UserCheck className="w-4.5 h-4.5" style={{ color: brandColor }} />
          </div>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.myTasksCount}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Tasks assigned to you</p>
          <p className="text-xs font-semibold mt-1.5" style={{ color: brandColor }}>Need your attention</p>
        </div>
        
        <div className={`p-3.5 rounded-xl border transition-all hover:scale-[1.02] cursor-pointer ${
          isDarkMode
            ? "bg-[#1a1c23] border-[#2a2d35] hover:border-[#A855F7]"
            : "bg-white border-gray-100 hover:border-[#4B0082]"
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 ${isDarkMode ? "bg-[#252832]" : "bg-gray-100"}`}>
            <AlertCircle className="w-4.5 h-4.5" style={{ color: brandColor }} />
          </div>
          <p className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{stats.overdue}</p>
          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Overdue</p>
          <p className="text-xs font-semibold mt-1.5" style={{ color: brandColor }}>Need attention</p>
        </div>
      </div>

      {/* Three Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* My Tasks Box */}
        <div className={`p-5 rounded-xl border flex flex-col h-[340px] ${
          isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-100"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>My Tasks</h3>
            <ListTodo className="w-4 h-4" style={{ color: brandColor }} />
          </div>
          <div className="flex-1">
            <div className="space-y-2">
              {myTasks.length === 0 ? (
                <p className={`text-sm text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No tasks assigned to you
                </p>
              ) : (
                myTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-3 group">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id, task.projectId, task.completed)}
                      disabled={togglingTask === task.id}
                      className="mt-0.5 w-4 h-4 rounded accent-[#4B0082] dark:accent-[#A855F7] cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${task.completed ? "line-through opacity-50" : ""} ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {task.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {task.projectTitle}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/tasks`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title="View all tasks"
                    >
                      <Eye className="w-3.5 h-3.5" style={{ color: brandColor }} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
          {myTasks.length > 0 && (
            <button
              onClick={() => router.push(`/tasks`)}
              className={`text-xs mt-3 pt-2 border-t flex items-center justify-center gap-1 transition-colors w-full ${
                isDarkMode 
                  ? "text-gray-400 hover:text-white border-gray-700" 
                  : "text-gray-500 hover:text-gray-700 border-gray-100"
              }`}
            >
              View all tasks →
            </button>
          )}
        </div>
        
        {/* My Projects Box */}
        <div className={`p-5 rounded-xl border flex flex-col h-[340px] ${
          isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-100"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>My Projects</h3>
            <FolderKanban className="w-4 h-4" style={{ color: brandColor }} />
          </div>
          <div className="flex-1">
            <div className="space-y-3">
              {myProjects.length === 0 ? (
                <p className={`text-sm text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No projects assigned to you
                </p>
              ) : (
                myProjects.slice(0, 2).map((project) => {
                  const totalTasks = project.tasks.length;
                  const completedTasks = project.tasks.filter(t => t.completed).length;
                  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                  return (
                    <div 
                      key={project.id} 
                      className="p-3 rounded-lg cursor-pointer hover:bg-purple-500/10 transition-all"
                      onClick={() => router.push(`/projects`)}
                    >
                      <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {project.title}
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Due {formatDate(project.endDate)}
                      </p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Progress</span>
                          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{progress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: brandColor }} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          {myProjects.length > 0 && (
            <button
              onClick={() => router.push(`/projects`)}
              className={`text-xs mt-3 pt-2 border-t flex items-center justify-center gap-1 transition-colors w-full ${
                isDarkMode 
                  ? "text-gray-400 hover:text-white border-gray-700" 
                  : "text-gray-500 hover:text-gray-700 border-gray-100"
              }`}
            >
              View all projects →
            </button>
          )}
        </div>

        {/* Upcoming Deadlines Box */}
        <div className={`p-5 rounded-xl border flex flex-col h-[340px] ${
          isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-100"
        }`}>
          <h3 className={`text-base font-semibold mb-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Upcoming Deadlines</h3>
          <div className="flex-1">
            <div className="space-y-3">
              {deadlines.length === 0 ? (
                <p className={`text-sm text-center py-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No upcoming deadlines
                </p>
              ) : (
                deadlines.slice(0, 2).map((d, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg transition-all cursor-pointer hover:scale-[1.01] ${
                      d.isAssignedToMe
                        ? isDarkMode 
                          ? "bg-[#4B0082]/20 hover:bg-[#4B0082]/30 border border-[#4B0082]/30" 
                          : "bg-purple-50 hover:bg-purple-100 border border-purple-200"
                        : isDarkMode 
                          ? "bg-[#252832] hover:bg-[#2d3038] hover:border hover:border-[#A855F7]" 
                          : "bg-gray-50 hover:bg-gray-100 hover:border hover:border-[#4B0082]"
                    }`}
                    onClick={() => router.push(`/projects`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {d.title}
                        </p>
                        {d.isAssignedToMe && (
                          <span className="text-[10px] font-semibold mt-0.5 inline-block" style={{ color: brandColor }}>
                            Assigned to you
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        d.overdue
                          ? "bg-red-500/20 text-red-400"
                          : d.urgent
                            ? "bg-orange-500/20 text-orange-400"
                            : isDarkMode 
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-200 text-gray-600"
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Due {formatDate(d.endDate)}
                    </p>
                    <div className="mt-2">
                      <div className="w-full h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                        <div className="h-full rounded-full transition-all" style={{ width: `${d.progress}%`, backgroundColor: brandColor }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {deadlines.length > 0 && (
            <button
              onClick={() => router.push(`/projects`)}
              className={`text-xs mt-3 pt-2 border-t flex items-center justify-center gap-1 transition-colors w-full ${
                isDarkMode 
                  ? "text-gray-400 hover:text-white border-gray-700" 
                  : "text-gray-500 hover:text-gray-700 border-gray-100"
              }`}
            >
              View all deadlines →
            </button>
          )}
        </div>
      </div>

      {/* Mini Calendar Section - Simple Version */}
      <div className={`p-5 rounded-xl border ${isDarkMode ? "bg-[#1a1c23] border-[#2a2d35]" : "bg-white border-gray-100"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" style={{ color: brandColor }} />
            <h3 className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Calendar</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={goToToday}
              className={`text-xs px-2 py-1 rounded transition-all hover:scale-105 ${
                isDarkMode 
                  ? "text-gray-400 hover:text-white" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(-1)}
              className={`p-1 rounded transition-all hover:scale-105 ${isDarkMode ? "hover:bg-[#252832]" : "hover:bg-gray-100"}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className={`p-1 rounded transition-all hover:scale-105 ${isDarkMode ? "hover:bg-[#252832]" : "hover:bg-gray-100"}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Simple Calendar Grid - Just dots for events */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, idx) => (
            <div
              key={idx}
              className={`text-center py-1.5 text-xs font-medium ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
            >
              {day.charAt(0)}
            </div>
          ))}
          
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-10" />;
            }
            
            const dateStr = date.toISOString().split('T')[0];
            const eventCount = calendarEvents[dateStr] || 0;
            const isToday = new Date().toDateString() === date.toDateString();
            
            return (
              <div
                key={dateStr}
                onClick={() => router.push("/calendar")}
                className={`h-10 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all hover:bg-purple-500/10 ${
                  isToday ? "bg-[#4B0082]/20" : ""
                }`}
              >
                <span className={`text-xs ${isToday ? "text-[#4B0082] font-semibold" : isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {date.getDate()}
                </span>
                {eventCount > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#4B0082] mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Simple Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: isDarkMode ? "#2a2d35" : "#e5e7eb" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#4B0082]"></div>
            <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Has events</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#4B0082]/30"></div>
            <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>Today</span>
          </div>
          <button
            onClick={() => router.push("/calendar")}
            className={`text-xs hover:underline ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            View full calendar →
          </button>
        </div>
      </div>
    </div>
  );
}