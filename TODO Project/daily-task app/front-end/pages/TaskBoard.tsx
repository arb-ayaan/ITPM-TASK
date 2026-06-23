import React, { useState } from "react";
import { Search, Filter, Plus, Calendar, ShieldAlert, Tag, Trash2, Edit3, CheckCircle, Circle, GripVertical, Check, ArrowUpDown, ChevronDown } from "lucide-react";
import { Task, TaskPriority, TaskStatus } from "../types";

interface TaskBoardProps {
  tasks: Task[];
  onAddTask: (task: { title: string; description: string; priority: TaskPriority; dueDate: string; category: string }) => Promise<void>;
  onUpdateTask: (id: number, fields: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  onReorderTasks: (orderedIds: number[]) => Promise<void>;
  onTriggerToast: (text: string, type: "success" | "error" | "info") => void;
  externalFilters?: {
    status?: "All" | "Pending" | "Completed";
    priority?: "All" | "Low" | "Medium" | "High";
    dueToday?: boolean;
    upcoming?: boolean;
  };
  onClearExternalFilters?: () => void;
  isAddFormOpen?: boolean;
  onSetIsAddFormOpen?: (open: boolean) => void;
}

export default function TaskBoard({ 
  tasks, 
  onAddTask, 
  onUpdateTask, 
  onDeleteTask, 
  onReorderTasks, 
  onTriggerToast,
  externalFilters,
  onClearExternalFilters,
  isAddFormOpen,
  onSetIsAddFormOpen
}: TaskBoardProps) {
  // Filters & State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Completed">("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | "Low" | "Medium" | "High">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"order" | "dueDate" | "priority" | "creationDate">("order");

  // Create Task Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("Medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategory, setNewCategory] = useState("Personal");
  const [localFormOpen, setLocalFormOpen] = useState(false);

  const isFormOpen = isAddFormOpen !== undefined ? isAddFormOpen : localFormOpen;
  const setIsFormOpen = onSetIsAddFormOpen || setLocalFormOpen;

  // Edit Task Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("Medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editCategory, setEditCategory] = useState("Personal");

  // Get unique categories from current tasks to populate filter dropdown dynamically
  const uniqueCategories = ["All", ...Array.from(new Set(tasks.map((t) => t.category || "Personal")))];

  // Form Submissions
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onTriggerToast("Please enter a valid task title.", "error");
      return;
    }
    if (!newDueDate) {
      onTriggerToast("Due date is mandatory for all tasks.", "error");
      return;
    }
    try {
      await onAddTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        dueDate: newDueDate,
        category: newCategory,
      });
      setNewTitle("");
      setNewDesc("");
      setNewPriority("Medium");
      setNewDueDate("");
      setNewCategory("Personal");
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEdit = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || "");
    setEditCategory(task.category || "Personal");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!editTitle.trim()) {
      onTriggerToast("Title cannot be blank.", "error");
      return;
    }

    try {
      await onUpdateTask(editingTask.id, {
        title: editTitle.trim(),
        description: editDesc.trim(),
        priority: editPriority,
        dueDate: editDueDate || undefined,
        category: editCategory,
      });
      setEditingTask(null);
    } catch (err) {
      console.error(err);
    }
  };

  // NATIVE HTML5 DRAG & DROP FOR TASK LIST REORDERING
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reorderedList = [...filteredAndSortedTasks];
    const [draggedItem] = reorderedList.splice(draggedIndex, 1);
    reorderedList.splice(targetIndex, 0, draggedItem);

    // Compute updated ID list order to send to SQLite
    const orderedIds = reorderedList.map((t) => t.id);
    try {
      await onReorderTasks(orderedIds);
    } catch (err) {
      console.error(err);
    } finally {
      setDraggedIndex(null);
    }
  };

  // Run Filters & Sorting client-side for ultra-fast, reactive experience
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const matchSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description.toLowerCase().includes(search.toLowerCase());

      // Evaluate external filters
      if (externalFilters) {
        if (externalFilters.status && externalFilters.status !== "All" && task.status !== externalFilters.status) {
          return false;
        }
        if (externalFilters.priority && externalFilters.priority !== "All" && task.priority !== externalFilters.priority) {
          return false;
        }
        
        const dueDateVal = task.dueDate;

        if (externalFilters.dueToday) {
          const localTodayStr = new Date().toISOString().split("T")[0];
          if (dueDateVal !== localTodayStr) {
            return false;
          }
        }
        if (externalFilters.upcoming) {
          const localTodayStr = new Date().toISOString().split("T")[0];
          const threeDaysLaterStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
          if (task.status !== "Pending" || !dueDateVal || dueDateVal < localTodayStr || dueDateVal > threeDaysLaterStr) {
            return false;
          }
        }
      }

      // Dropdowns filter logic (only applies when that filter is not overridden externally)
      const matchStatus = externalFilters?.status
        ? true
        : (statusFilter === "All" || task.status === statusFilter);

      const matchPriority = externalFilters?.priority
        ? true
        : (priorityFilter === "All" || task.priority === priorityFilter);

      const matchCategory =
        categoryFilter === "All" || task.category === categoryFilter;

      return matchSearch && matchStatus && matchPriority && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === "priority") {
        const valueMap = { High: 1, Medium: 2, Low: 3 };
        return valueMap[a.priority] - valueMap[b.priority];
      }
      if (sortBy === "creationDate") {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return a.orderIndex - b.orderIndex; // Default drag ordering SQLite state index
    });

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case "High": return "bg-rose-50 text-rose-600 border border-rose-100";
      case "Medium": return "bg-amber-50 text-amber-600 border border-amber-100";
      case "Low": return "bg-blue-50 text-blue-600 border border-blue-100";
    }
  };

  return (
    <div className="flex flex-col gap-6" id="taskboard-workspace">
      {/* Search & Configurations Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1" id="search-bar">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Create launcher */}
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
          id="btn-trigger-post"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Daily Task
        </button>
      </div>

      {/* Expanded Create Form Sheet */}
      {isFormOpen && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-5 animate-in fade-in slide-in-from-top-4 duration-300"
          id="form-post-task"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Initialize New Task</h3>
            <span className="text-[10px] text-slate-400">All tasks are persisted securely</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Task Title *</label>
              <input
                type="text"
                required
                placeholder="Enter summary (e.g. Design applet layout)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Priority Level</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Due Date *</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-xs font-bold text-slate-500">Category Tag</label>
              <input
                type="text"
                placeholder="Work, Fitness, Personal, Learning..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500">Task Description</label>
            <textarea
              placeholder="Provide clarifying context, key links, or specific steps..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 rounded-lg transition font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition font-bold cursor-pointer"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Interactive Quick Filter bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" id="navigation-filters">
        {/* Status filters */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600 font-semibold"
          >
            <option value="All">All Incomplete/Done</option>
            <option value="Pending">Incomplete / Active</option>
            <option value="Completed">Completed Only</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Priority
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600 font-semibold"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Tag className="w-3 h-3" /> Category
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600 font-semibold"
          >
            {uniqueCategories.map((cat, i) => (
              <option key={i} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Sort option */}
        <div className="flex flex-col gap-1.5 col-span-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort Layout
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600 font-semibold"
          >
            <option value="order">Manual Drag Order (Default)</option>
            <option value="dueDate">Due Date (Ascending)</option>
            <option value="priority">Priority Level (High first)</option>
            <option value="creationDate">Creation Date (Newest first)</option>
          </select>
        </div>
      </div>

      {/* Task List container */}
      <div className="flex flex-col gap-2" id="task-cards-list-box">
        {filteredAndSortedTasks.length > 0 ? (
          filteredAndSortedTasks.map((task, index) => (
            <div
              key={task.id}
              draggable={sortBy === "order"} // Enable drag ONLY when manual order sorting is active to protect analytical view bounds
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className={`bg-white rounded-xl p-4 border transition flex items-center gap-4 group/card cursor-grab active:cursor-grabbing ${
                task.status === "Completed"
                  ? "border-emerald-200 bg-emerald-50/20 shadow-none opacity-80"
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md shadow-xs"
              }`}
              id={`task-item-${task.id}`}
            >
              {/* Drag controller handle icon when active */}
              {sortBy === "order" && (
                <div className="text-slate-300 hover:text-slate-400 cursor-grab shrink-0">
                  <GripVertical className="w-4 h-4" />
                </div>
              )}

              {/* Completion status toggle circle */}
              <button
                onClick={() =>
                  onUpdateTask(task.id, {
                    status: task.status === "Completed" ? "Pending" : "Completed"
                  })
                }
                className={`p-1 rounded-full transition shrink-0 ${
                  task.status === "Completed"
                    ? "text-emerald-500 bg-emerald-50 hover:bg-emerald-100"
                    : "text-slate-300 hover:text-slate-400 bg-slate-50"
                }`}
                title={task.status === "Completed" ? "Undo completed tasks" : "Mark task as completed"}
              >
                {task.status === "Completed" ? (
                  <Check className="w-4.5 h-4.5 stroke-[3]" />
                ) : (
                  <div className="w-4.5 h-4.5 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-500 transition-colors" />
                )}
              </button>

              {/* Task Title & Core Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`text-sm font-semibold truncate ${
                      task.status === "Completed" ? "line-through text-slate-400" : "text-slate-800"
                    }`}
                  >
                    {task.title}
                  </span>
                  
                  {/* Category */}
                  {task.category && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                      {task.category}
                    </span>
                  )}

                  {/* Priority Badging */}
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getPriorityBadgeClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>

                {/* Description */}
                {task.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 md:line-clamp-1 mb-1.5 leading-relaxed font-light">
                    {task.description}
                  </p>
                )}

                {/* Due Date Indicator */}
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Calendar className="w-3 h-3" />
                    <span>Due {task.dueDate}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 lg:opacity-0 group-hover/card:opacity-100 transition duration-150 shrink-0">
                <button
                  onClick={() => handleStartEdit(task)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                  title="Modify task detail"
                  id={`btn-edit-task-${task.id}`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Remove task permanently"
                  id={`btn-delete-task-${task.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-2 shadow-xs">
            <span className="text-sm font-semibold text-slate-500">Workspace is completely empty!</span>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              No daily tasks match your current filter preferences. Add items above to build daily logs.
            </p>
          </div>
        )}
      </div>

      {/* Editing Task Modal Sheet overlay */}
      {editingTask && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl w-full max-w-lg flex flex-col gap-5 animate-in zoom-in-95 duration-150"
            id="form-patch-task"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4.5 h-4.5 text-indigo-500" /> Modifying Task
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-extrabold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Task Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Priority Level</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-600"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500">Due Date *</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-500"
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-500">Category Tag</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Task Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-xs text-slate-500 hover:bg-slate-50 rounded-lg transition font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg transition font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
