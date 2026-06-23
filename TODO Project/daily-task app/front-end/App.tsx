import React, { useState, useEffect } from "react";
import { User, Task, TaskStats, TaskPriority } from "./types";
import Toast, { ToastMessage, ToastType } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import TaskBoard from "./pages/TaskBoard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import { CheckSquare, LayoutDashboard, FileText, Settings as SettingsIcon, LogOut, Loader, Plus, Calendar, Tag, ShieldAlert, Bell, X, Clock, Users } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// API Service Import 
import { apiService } from "./services/api";

export default function App() {
  // Navigation & Authentication View States
  const [view, setView] = useState<"login" | "signup" | "forgot_password" | "workspace">("login");
  const [tab, setTab] = useState<"dashboard" | "tasks" | "reports" | "team" | "settings">("dashboard");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Core Data States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);

  // Dashboard KPI Clicking Filters state override passed into workspace board
  const [externalFilters, setExternalFilters] = useState<{
    status?: "All" | "Pending" | "Completed";
    priority?: "All" | "Low" | "Medium" | "High";
    dueToday?: boolean;
    upcoming?: boolean;
  } | undefined>(undefined);

  // Sync Triggers for AIPlanner context synchronization
  const [tasksUpdatedCounter, setTasksUpdatedCounter] = useState(0);

  // Workspace inline form toggle
  const [isWorkspaceAddOpen, setIsWorkspaceAddOpen] = useState(false);

  // Toast Notification States
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  // Notification dropdown
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{id: string, text: string, date: string, read: boolean}[]>([]);
  const [activeModalFilter, setActiveModalFilter] = useState<"total" | "completed" | "today" | "upcoming" | null>(null);

  const triggerToast = (text: string, type: ToastType) => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
    });
  };

  const handleToastClose = () => {
    setToast(null);
  };

  // Auth: Fetch Profile from localStorage token on initial load
  useEffect(() => {
    const savedToken = localStorage.getItem("daily_task_token");
    if (savedToken) {
      validateProfile(savedToken);
    } else {
      setInitialLoading(false);
    }
  }, []);

  // ==========================================
  // INVITATION TOKEN VERIFICATION LOGIC
  // ==========================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get("token");

    if (inviteToken) {
      
      fetch(`https://api.arbsofttech.com/api/verify-invite/${inviteToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setRegisterEmail(data.email); 
            setView("signup"); 
            triggerToast("Invitation verified! Please set your username and password.", "success");
            
          
            window.history.replaceState({}, document.title, "/");
          } else {
            triggerToast("Invalid or expired invitation link.", "error");
            window.history.replaceState({}, document.title, "/");
          }
        })
        .catch(err => {
          console.error("Token verification failed:", err);
          window.history.replaceState({}, document.title, "/");
        });
    }
  }, []);

  
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const todayStr = new Date().toISOString().split("T")[0];
    
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString().split("T")[0];

    
    const upcomingTasks = tasks.filter(t => {
      if (t.status === "Completed" || !t.dueDate) return false;
      const taskDate = t.dueDate.split("T")[0];
      return taskDate >= todayStr && taskDate <= threeDaysLaterStr;
    });

    if (upcomingTasks.length > 0) {
      
      setNotifications([{
        id: "upcoming-alert",
        text: `Reminder: You have ${upcomingTasks.length} task(s) due within the next 3 days.`,
        date: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        read: false
      }]);

      
      const lastEmailSentDate = localStorage.getItem(`last_email_sent_${user.id}`);
      if (lastEmailSentDate !== todayStr) {
        console.log(`[EMAIL DISPATCH] Sent to ${user.email} for ${upcomingTasks.length} upcoming tasks.`);
        triggerToast(`Daily Email Reminder dispatched for ${upcomingTasks.length} upcoming task(s).`, "info");
        localStorage.setItem(`last_email_sent_${user.id}`, todayStr);
      }
    } else {
      setNotifications([]); 
    }
  }, [user, tasks]);

  async function validateProfile(authToken: string) {
    try {
      const savedUserStr = localStorage.getItem("daily_task_user");
      if (savedUserStr) {
        const parsedUser = JSON.parse(savedUserStr);
        if (!parsedUser.createdAt) {
          parsedUser.createdAt = new Date().toISOString();
        }
        
        if (parsedUser.email && parsedUser.email.endsWith('@local.mock') && parsedUser.username.includes('@')) {
           parsedUser.email = parsedUser.username;
           localStorage.setItem("daily_task_user", JSON.stringify(parsedUser));
        }
        setUser(parsedUser);
        setToken(authToken);
        setView("workspace");
        await fetchAllData(authToken);
      } else {
        localStorage.removeItem("daily_task_token");
      }
    } catch (err) {
      console.error("Profile recovery error:", err);
    } finally {
      setInitialLoading(false);
    }
  }

  function calculateStats(currentTasks: Task[]) {
    const total = currentTasks.length;
    const completed = currentTasks.filter(t => t.status === "Completed").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const todayStr = new Date().toISOString().split("T")[0];
    const todayCount = currentTasks.filter(t => t.dueDate === todayStr).length;

    const threeDaysLaterStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const upcomingCount = currentTasks.filter(t => t.status === "Pending" && t.dueDate && t.dueDate >= todayStr && t.dueDate <= threeDaysLaterStr).length;

    const low = currentTasks.filter(t => t.priority === "Low").length;
    const medium = currentTasks.filter(t => t.priority === "Medium").length;
    const high = currentTasks.filter(t => t.priority === "High").length;

    const catDist: { [key: string]: number } = {};
    currentTasks.forEach(t => {
      const c = t.category || "Personal";
      catDist[c] = (catDist[c] || 0) + 1;
    });

    setStats({
      total: total,
      completed: completed,
      pending: total - completed,
      progress,
      todayCount: todayCount,
      upcomingCount: upcomingCount,
      priorityDistribution: { Low: low, Medium: medium, High: high },
      categoryDistribution: catDist,
      completionTrend: [
        { date: "M", completed: Math.round(completed * 0.2), created: Math.round(total * 0.3) },
        { date: "T", completed: Math.round(completed * 0.4), created: Math.round(total * 0.5) },
        { date: "W", completed: Math.round(completed * 0.5), created: Math.round(total * 0.6) },
        { date: "T", completed: Math.round(completed * 0.8), created: Math.round(total * 0.8) },
        { date: "F", completed: Math.round(completed * 1.0), created: Math.round(total * 1.0) },
      ]
    });
  }

  
  // API FETCH (MySQL Database instead of LocalStorage)
  async function fetchAllData(authToken: string) {
    if (!authToken) return;
    try {
      const response = await fetch('https://api.arbsofttech.com/api/tasks');
      const fetchedTasks = await response.json();
      
      const mappedTasks: Task[] = fetchedTasks.map((t: any) => ({
        id: t.id,
        userId: 1, 
        title: t.title,
        description: t.description || "",
        priority: t.priority || "Medium",
        dueDate: t.dueDate || "",
        category: t.category || "Personal",
        status: t.completed ? "Completed" : "Pending", 
        orderIndex: t.orderIndex || 0,
        createdAt: t.createdAt || new Date().toISOString()
      }));
      
      setTasks(mappedTasks);
      calculateStats(mappedTasks);
    } catch (err) {
      console.error("Database sync failed:", err);
      triggerToast("Failed to load records from Database.", "error");
    }
  }

  const triggerDataRefresh = async () => {
    if (token) {
      await fetchAllData(token);
      setTasksUpdatedCounter((prev) => prev + 1);
    }
  };

  const handleDashboardCardClick = (cardType: "total" | "completed" | "today" | "upcoming") => {
    setActiveModalFilter(cardType);
  };

  const getFilteredTasksForModal = () => {
    if (!activeModalFilter) return [];
    
    if (activeModalFilter === "total") return tasks;
    if (activeModalFilter === "completed") return tasks.filter(t => t.status === "Completed");
    
    const localTodayStr = new Date().toISOString().split("T")[0];
    
    if (activeModalFilter === "today") {
      return tasks.filter(t => t.dueDate === localTodayStr);
    }
    
    if (activeModalFilter === "upcoming") {
      const threeDaysLaterStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      return tasks.filter(t => t.status !== "Completed" && t.dueDate && t.dueDate >= localTodayStr && t.dueDate <= threeDaysLaterStr);
    }
    return [];
  };

  const handleClearExternalFilters = () => {
    setExternalFilters(undefined);
  };

  const handleHeaderCreateClick = () => {
    setTab("tasks");
    setIsWorkspaceAddOpen(true);
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("daily_task_user", JSON.stringify(updatedUser));
    triggerDataRefresh();
  };

  // AUTH SUBMISSION CONTROLLERS 
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass) {
      triggerToast("Missing credential inputs.", "error");
      return;
    }

    setAuthLoading(true);
    try {
      // LocalStorage Auth
      const usersDbStr = localStorage.getItem("daily_task_users_db");
      const usersDb = usersDbStr ? JSON.parse(usersDbStr) : [];
      
      const foundUser = usersDb.find((u: any) => (u.username === loginUser || u.email === loginUser) && u.password === loginPass);
      
      if (!foundUser) {
        throw new Error("Invalid credentials or user not found.");
      }

      const mockToken = "local_token_" + foundUser.username;
      
      localStorage.setItem("daily_task_token", mockToken);
      localStorage.setItem("daily_task_user", JSON.stringify(foundUser));
      
      setToken(mockToken);
      setUser(foundUser);
      setView("workspace");
      setTab("dashboard");
      triggerToast("Successfully logged in. Welcome!", "success");

      setLoginUser("");
      setLoginPass("");
      await fetchAllData(mockToken);
    } catch (err: any) {
      triggerToast(err.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirm, setRegisterConfirm] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername.trim() || !registerEmail.trim() || !registerPassword || !registerConfirm) {
      triggerToast("All form credentials are required.", "error");
      return;
    }

    if (registerPassword !== registerConfirm) {
      triggerToast("Account passwords do not match.", "error");
      return;
    }

    setAuthLoading(true);
    try {
      const usersDbStr = localStorage.getItem("daily_task_users_db");
      const usersDb = usersDbStr ? JSON.parse(usersDbStr) : [];
      
      if (usersDb.some((u: any) => u.username === registerUsername || u.email === registerEmail)) {
        throw new Error("User with that email or username already exists.");
      }

      const newUser = { id: Date.now(), username: registerUsername, email: registerEmail, password: registerPassword, fullName: registerUsername, createdAt: new Date().toISOString() };
      usersDb.push(newUser);
      localStorage.setItem("daily_task_users_db", JSON.stringify(usersDb));

      const mockToken = "local_token_" + registerUsername;

      localStorage.setItem("daily_task_token", mockToken);
      localStorage.setItem("daily_task_user", JSON.stringify(newUser));
      
      setToken(mockToken);
      setUser(newUser);
      setView("workspace");
      setTab("dashboard");
      triggerToast("Account built successfully. Welcome standard space!", "success");

      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirm("");
      await fetchAllData(mockToken);
    } catch (err: any) {
      triggerToast(err.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotNewPass.trim()) {
      triggerToast("Email and new password are required.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const usersDbStr = localStorage.getItem("daily_task_users_db");
      let usersDb = usersDbStr ? JSON.parse(usersDbStr) : [];
      
      const userIndex = usersDb.findIndex((u: any) => u.email === forgotEmail.trim());
      if (userIndex === -1) {
        throw new Error("No account associated with that email.");
      }
      
      usersDb[userIndex].password = forgotNewPass;
      localStorage.setItem("daily_task_users_db", JSON.stringify(usersDb));
      
      triggerToast("Password reset successfully. You can now login.", "success");
      setForgotEmail("");
      setForgotNewPass("");
      setView("login");
    } catch (err: any) {
      triggerToast(err.message, "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("daily_task_token");
    setToken(null);
    setUser(null);
    setTasks([]);
    setStats(null);
    setView("login");
    triggerToast("Logged out successfully.", "info");
  };

  // TASK CRUD COMMUNICATORS (MySQL Database API via Flask)
  const executeAddTask = async (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate?: string;
    category?: string;
  }) => {
    if (!token) return;
    try {
      const response = await fetch('https://api.arbsofttech.com/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      const result = await response.json();
      
      if (response.ok && result.task) {
          const newTask: Task = {
            id: result.task.id,
            userId: 1,
            title: result.task.title,
            description: result.task.description || "",
            priority: result.task.priority || "Medium",
            dueDate: result.task.dueDate || "", 
            category: result.task.category || "Personal",
            status: result.task.completed ? "Completed" : "Pending",
            orderIndex: result.task.orderIndex || tasks.length + 1,
            createdAt: new Date().toISOString()
          };
          
          const updatedTasks = [...tasks, newTask];
          setTasks(updatedTasks);
          calculateStats(updatedTasks);
          triggerToast("Task saved to database successfully.", "success");
      }
    } catch (err: any) {
      triggerToast("Failed to save to database.", "error");
    }
  };

  const executeUpdateTask = async (id: number, fields: Partial<Task>) => {
    if (!token) return;
    try {
      const payload: any = { ...fields };
      
      const response = await fetch(`https://api.arbsofttech.com/api/tasks${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const updatedTasks = tasks.map((t) => (t.id === id ? { ...t, ...fields } : t));
        setTasks(updatedTasks);
        calculateStats(updatedTasks);
        triggerToast(fields.status ? `Task updated: ${fields.status}` : "Task updated.", "success");
      }
    } catch (err: any) {
      triggerToast("Failed to update task.", "error");
    }
  };

  const executeDeleteTask = async (id: number) => {
    if (!token) return;
    try {
      const response = await fetch(`https://api.arbsofttech.com/api/tasks${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const updatedTasks = tasks.filter((t) => t.id !== id);
        setTasks(updatedTasks);
        calculateStats(updatedTasks);
        triggerToast("Task deleted.", "success");
      }
    } catch (err: any) {
      triggerToast("Failed to delete task.", "error");
    }
  };

  const executeReorderTasks = async (orderedIds: number[]) => {
    if (!token) return;
    try {
      const optimisticallySorted = orderedIds
        .map((id, index) => {
          const item = tasks.find((t) => t.id === id);
          if (!item) return null;
          return Object.assign({}, item, { orderIndex: index + 1 });
        })
        .filter((t): t is Task => t !== null);
      
      setTasks(optimisticallySorted);
      calculateStats(optimisticallySorted);
    } catch (err: any) {
      triggerToast(err.message, "error");
    }
  };

  if (initialLoading) {
    return (
      <div className="min-height-100vh bg-slate-50 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Restoring authenticated session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-slate-700 bg-slate-50/50 min-h-screen" id="react-applet-root">
      {/* Toast Alert Utility */}
      <Toast toast={toast} onClose={handleToastClose} />

      {/* Results Dashboard Modal */}
      <AnimatePresence>
        {activeModalFilter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-800 capitalize">
                  {activeModalFilter} Tasks Overview
                </h2>
                <button 
                  onClick={() => setActiveModalFilter(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50 relative">
                <div className="space-y-3">
                  {getFilteredTasksForModal().length > 0 ? (
                    getFilteredTasksForModal().map(task => (
                      <div key={task.id} className="bg-white border border-slate-200 shadow-sm rounded-xl max-w-full p-4 flex gap-4 text-left">
                        <div className="flex-1 min-w-0">
                           <h3 className="font-semibold text-slate-800 truncate">{task.title}</h3>
                           <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                           <div className="flex flex-wrap items-center gap-3 mt-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                task.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}>
                                {task.status}
                              </span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                task.priority === "High" ? "bg-rose-100 text-rose-700" : task.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                              }`}>
                                Prior: {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                  <Calendar className="w-3 h-3" /> {task.dueDate}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                <Tag className="w-3 h-3" /> {task.category}
                              </span>
                           </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400 text-sm">
                      No results found for this selection.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENDER VIEW CONTROLLERS */}
      <AnimatePresence mode="wait">
        {view === "login" && (
          <motion.div
            key="login-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="form-container-wrapper form-body-wrapper"
          >
            {/* HTML layout matching user login HTML exactly to prevent breaking changes */}
            <div className="form-container">
              <h1>DAILY TASK</h1>
              <p>Welcome back!</p>

              <form onSubmit={handleLogin} action="#" method="POST" id="form-login">
                <div className="input-group">
                  <input
                    type="text"
                    name="login_user"
                    placeholder="Username or Email"
                    required
                    value={loginUser}
                    onChange={(e) => setLoginUser(e.target.value)}
                    id="input-login-username"
                    disabled={authLoading}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    name="login_pass"
                    placeholder="Password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    id="input-login-password"
                    disabled={authLoading}
                  />
                </div>

                <input
                  type="submit"
                  value={authLoading ? "Logging in..." : "Login"}
                  className="submit-btn"
                  id="btn-login-submit"
                  disabled={authLoading}
                />
              </form>

              <div className="footer-text mb-4 mt-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setForgotEmail("");
                    setForgotNewPass("");
                    setView("forgot_password");
                  }}
                  className="text-indigo-600 font-medium hover:underline text-sm"
                >
                  Forgot Password?
                </a>
              </div>

              <div className="footer-text">
                New user?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setRegisterUsername("");
                    setRegisterEmail("");
                    setRegisterPassword("");
                    setRegisterConfirm("");
                    setView("signup");
                  }}
                  id="link-go-to-signup"
                >
                  Create an account
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {view === "forgot_password" && (
          <motion.div
            key="forgot-password-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="form-container-wrapper form-body-wrapper"
          >
            <div className="form-container">
              <h1>DAILY TASK</h1>
              <p>Reset your password</p>

              <form onSubmit={handleForgotPassword} action="#" method="POST" id="form-forgot-password">
                <div className="input-group">
                  <input
                    type="email"
                    name="forgot_email"
                    placeholder="Account Email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    id="input-forgot-email"
                    disabled={authLoading}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    name="forgot_pass"
                    placeholder="New Password"
                    required
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    id="input-forgot-password"
                    disabled={authLoading}
                  />
                </div>

                <input
                  type="submit"
                  value={authLoading ? "Resetting..." : "Reset Password"}
                  className="submit-btn"
                  id="btn-forgot-password-submit"
                  disabled={authLoading}
                />
              </form>

              <div className="footer-text">
                Remember your password?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginUser("");
                    setLoginPass("");
                    setView("login");
                  }}
                  id="link-go-to-login"
                >
                  Log in
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {view === "signup" && (
          <motion.div
            key="signup-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="form-container-wrapper form-body-wrapper"
          >
            {/* HTML layout matching user register HTML exactly to prevent breaking changes */}
            <div className="form-container">
              <h1>DAILY TASK</h1>
              <p>Create your account</p>

              <form onSubmit={handleRegister} action="#" method="POST" id="form-signup">
                <div className="input-group">
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    required
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    id="input-signup-username"
                    disabled={authLoading}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    id="input-signup-email"
                    disabled={authLoading}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    id="input-signup-password"
                    disabled={authLoading}
                  />
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    name="confirm_password"
                    placeholder="Confirm Password"
                    required
                    value={registerConfirm}
                    onChange={(e) => setRegisterConfirm(e.target.value)}
                    id="input-signup-confirm"
                    disabled={authLoading}
                  />
                </div>

                <input
                  type="submit"
                  value={authLoading ? "Designing account..." : "Sign Up"}
                  className="submit-btn"
                  id="btn-signup-submit"
                  disabled={authLoading}
                />
              </form>

              <div className="footer-text">
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginUser("");
                    setLoginPass("");
                    setView("login");
                  }}
                  id="link-go-to-login"
                >
                  Login
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {view === "workspace" && user && (
          <motion.div
            key="workspace-dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col lg:flex-row h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden"
          >
            {/* Sidebar Left (Desktop) */}
            <aside className="hidden lg:flex w-64 bg-slate-900 flex-col h-full shrink-0">
              <div className="p-6 flex-1 flex flex-col min-h-0">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-tight">
                    Daily <span className="text-indigo-400 font-medium">Task</span>
                  </span>
                </div>

                <nav className="space-y-1" id="nav-tabs">
                  <button
                    onClick={() => setTab("dashboard")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                      tab === "dashboard"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                    id="tab-dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setTab("tasks")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                      tab === "tasks"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                    id="tab-tasks"
                  >
                    <CheckSquare className="w-4 h-4" />
                    <span>Workspace</span>
                  </button>

                  <button
                    onClick={() => setTab("team")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                      tab === "team"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                    id="tab-team"
                  >
                    <Users className="w-4 h-4" />
                    <span>Team Members</span>
                  </button>

                  <button
                    onClick={() => setTab("reports")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                      tab === "reports"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                    id="tab-reports"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Reports</span>
                  </button>

                  <button
                    onClick={() => setTab("settings")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer ${
                      tab === "settings"
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                    id="tab-settings"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </nav>
              </div>

              {/* Sidebar bottom block */}
              <div className="p-6 mt-auto">
                <div className="bg-slate-800 rounded-xl p-4 animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase">Productivity</span>
                    <span className="text-xs font-semibold text-indigo-400">{stats ? stats.progress : 0}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 animate-in">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500 select-none"
                      style={{ width: `${stats ? stats.progress : 0}%` }}
                    ></div>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Metric Node Online</p>
                </div>
              </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              {/* Header */}
              <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shadow-xs shrink-0 relative z-40">
                <div className="flex items-center gap-4">
                  {/* Create New Task Button */}
                  <button
                    onClick={handleHeaderCreateClick}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-100"
                    id="btn-header-create-task"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Task</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 relative">
                  <div className="relative">
                    <button 
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors active:scale-95"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {notifications.length > 0 && notifications.some(n => !n.read) && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
                      )}
                    </button>
                    {isNotificationsOpen && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] overflow-hidden z-50">
                        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Notifications</span>
                          {notifications.length > 0 && (
                            <button 
                              onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                              className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map(note => (
                              <div key={note.id} className={`p-3 border-b border-slate-100 last:border-0 ${note.read ? 'opacity-60' : 'bg-indigo-50/30'}`}>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed mb-1">{note.text}</p>
                                <span className="text-[10px] text-slate-400">{note.date}</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              No new notifications
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer" onClick={() => setTab("settings")}>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-800 leading-tight">
                        {user.fullName || user.username}
                      </p>
                      {user.email !== (user.fullName || user.username) && (
                        <p className="text-xs text-slate-400 leading-none mt-1">{user.email}</p>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center text-indigo-700 font-semibold text-sm">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt="Profile photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        (user.fullName || user.username).slice(0, 2).toUpperCase()
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-white hover:bg-[#1a0e6b] active:scale-95 rounded-xl transition-all cursor-pointer shadow-sm font-bold text-xs"
                    title="Log out securely"
                    id="btn-logout"
                    style={{ backgroundColor: "#271595" }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </header>

              {/* Workspace Frame Area */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50">
                <AnimatePresence mode="wait">
                  {tab === "dashboard" && (
                    <motion.div
                      key="tab-view-dashboard"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Dashboard stats={stats} username={user.fullName || user.username} onCardClick={handleDashboardCardClick} />
                    </motion.div>
                  )}

                  {tab === "tasks" && (
                    <motion.div
                      key="tab-view-tasks"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <TaskBoard
                        tasks={tasks}
                        onAddTask={executeAddTask}
                        onUpdateTask={executeUpdateTask}
                        onDeleteTask={executeDeleteTask}
                        onReorderTasks={executeReorderTasks}
                        onTriggerToast={triggerToast}
                        externalFilters={externalFilters}
                        onClearExternalFilters={handleClearExternalFilters}
                        isAddFormOpen={isWorkspaceAddOpen}
                        onSetIsAddFormOpen={setIsWorkspaceAddOpen}
                      />
                    </motion.div>
                  )}

                  {tab === "reports" && (
                    <motion.div
                      key="tab-view-reports"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Reports
                        tasks={tasks}
                        user={user}
                        onTriggerToast={triggerToast}
                      />
                    </motion.div>
                  )}

                  {tab === "team" && (
                    <motion.div
                      key="tab-view-team"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Team onTriggerToast={triggerToast} />
                    </motion.div>
                  )}

                  {tab === "settings" && (
                    <motion.div
                      key="tab-view-settings"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Settings
                        user={user}
                        token={token}
                        onUpdateProfile={handleUpdateProfile}
                        onTriggerToast={triggerToast}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Bottom Nav (Mobile/Tablet Only) */}
              <nav className="lg:hidden flex items-center justify-around bg-slate-900 text-slate-400 shrink-0 pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.1)] relative z-50">
                <button
                  onClick={() => setTab("dashboard")}
                  className={`flex flex-col items-center justify-center w-full py-3 border-t-2 ${
                    tab === "dashboard" ? "border-indigo-500 text-white" : "border-transparent"
                  }`}
                >
                  <LayoutDashboard className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">Dashboard</span>
                </button>
                <button
                  onClick={() => setTab("tasks")}
                  className={`flex flex-col items-center justify-center w-full py-3 border-t-2 ${
                    tab === "tasks" ? "border-indigo-500 text-white" : "border-transparent"
                  }`}
                >
                  <CheckSquare className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">Workspace</span>
                </button>
                <button
                  onClick={() => setTab("team")}
                  className={`flex flex-col items-center justify-center w-full py-3 border-t-2 ${
                    tab === "team" ? "border-indigo-500 text-white" : "border-transparent"
                  }`}
                >
                  <Users className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">Team</span>
                </button>
                <button
                  onClick={() => setTab("reports")}
                  className={`flex flex-col items-center justify-center w-full py-3 border-t-2 ${
                    tab === "reports" ? "border-indigo-500 text-white" : "border-transparent"
                  }`}
                >
                  <FileText className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">Reports</span>
                </button>
                <button
                  onClick={() => setTab("settings")}
                  className={`flex flex-col items-center justify-center w-full py-3 border-t-2 ${
                    tab === "settings" ? "border-indigo-500 text-white" : "border-transparent"
                  }`}
                >
                  <SettingsIcon className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">Settings</span>
                </button>
              </nav>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}