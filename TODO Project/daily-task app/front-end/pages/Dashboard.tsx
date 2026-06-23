import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import { CheckSquare, Clock, AlertCircle, Percent, Calendar, Hourglass, BarChart3, TrendingUp, Compass } from "lucide-react";
import { TaskStats } from "../types";

interface DashboardProps {
  stats: TaskStats | null;
  username: string;
  onCardClick?: (cardType: "total" | "completed" | "today" | "upcoming") => void;
}

const COLORS = ["#4f46e5", "#10b981", "#fbbf24", "#38bdf8", "#ec4899", "#64748b"];
const PRIORITY_COLORS: { [key: string]: string } = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#3b82f6"
};

export default function Dashboard({ stats, username, onCardClick }: DashboardProps) {
  if (!stats) {
    return (
      <div className="py-12 text-center bg-white rounded-2xl border border-slate-100 p-6 shadow-sm" id="dashboard-loading">
        <LoaderSpinner />
        <p className="text-sm text-slate-500 mt-2">Aggregating historical analytical data...</p>
      </div>
    );
  }

  // Formatting Priority Data for PieChart
  const priorityData = Object.keys(stats.priorityDistribution)
    .map((key) => ({
      name: key,
      value: stats.priorityDistribution[key as keyof typeof stats.priorityDistribution] || 0
    }))
    .filter((p) => p.value > 0);

  // Formatting Category Data for BarChart
  const categoryData = Object.keys(stats.categoryDistribution).map((key) => ({
    name: key,
    value: stats.categoryDistribution[key]
  }));

  return (
    <div className="flex flex-col gap-6" id="dashboard-analytical-root">
      {/* Header Greeting Card */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-end pr-10 pointer-events-none">
          <Compass className="w-48 h-48 rotate-12" />
        </div>
        <div className="relative z-10">
          <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Workspace Hub
          </span>
          <h1 className="text-2xl md:text-3xl font-black mt-3">Welcome, {username}!</h1>
          <p className="text-slate-300 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
            Organize daily items, explore automated smart actions, and audit your productivity curves.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-banner">
        {/* Total stats */}
        <div 
          onClick={() => onCardClick?.("total")}
          className="bg-white rounded-2xl p-4.5 border border-slate-200 hover:border-indigo-400 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 flex items-center gap-4 cursor-pointer select-none"
        >
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Total Registered</span>
            <span className="text-xl font-bold text-slate-800">{stats.total}</span>
          </div>
        </div>

        {/* Completed Stats */}
        <div 
          onClick={() => onCardClick?.("completed")}
          className="bg-white rounded-2xl p-4.5 border border-slate-200 hover:border-indigo-400 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 flex items-center gap-4 cursor-pointer select-none"
        >
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Completed Tasks</span>
            <span className="text-xl font-bold text-slate-800">{stats.completed}</span>
          </div>
        </div>

        {/* Today's Tasks */}
        <div 
          onClick={() => onCardClick?.("today")}
          className="bg-white rounded-2xl p-4.5 border border-slate-200 hover:border-indigo-400 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 flex items-center gap-4 cursor-pointer select-none"
        >
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Due Today</span>
            <span className="text-xl font-bold text-amber-600">{stats.todayCount}</span>
          </div>
        </div>

        {/* Pending Deadlines */}
        <div 
          onClick={() => onCardClick?.("upcoming")}
          className="bg-white rounded-2xl p-4.5 border border-slate-200 hover:border-indigo-400 hover:shadow-xs hover:-translate-y-0.5 active:scale-95 transition-all duration-150 flex items-center gap-4 cursor-pointer select-none"
        >
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <Hourglass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-0.5">Upcoming (3d)</span>
            <span className="text-xl font-bold text-rose-600">{stats.upcomingCount}</span>
          </div>
        </div>
      </div>

      {/* Progress & Balances Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Core Progress Bar card */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-center gap-4">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5 justify-center">
            <Percent className="w-4 h-4 text-emerald-500" /> Focus Progression Rate
          </span>
          <div className="relative flex items-center justify-center my-2">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="#f1f5f9"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r="52"
                stroke="#4f46e5"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={326.7}
                strokeDashoffset={326.7 - (326.7 * stats.progress) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-slate-800">{stats.progress}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Ratio</span>
            </div>
          </div>
          <div className="text-center text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            {stats.progress >= 80 ? (
              <p className="text-emerald-700 font-semibold">Stellar execution pace! Keep pushing high impact zone targets.</p>
            ) : stats.progress >= 50 ? (
              <p className="text-amber-700 font-semibold">Over halfway there. Focus on finishing low-hanging priority items.</p>
            ) : (
              <p className="text-slate-500">Initiate structured scheduling inside your planning space to improve balance metrics.</p>
            )}
          </div>
        </div>

        {/* Recharts Analytics Graphs */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-slate-500" /> Productivity Curve
            </span>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-semibold">Weekly View</span>
          </div>
          <div className="h-48" id="trend-chart-container">
            {stats.completionTrend && stats.completionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.completionTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px", border: "1px solid #f1f5f9" }} />
                  <Area type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" name="Tasks Created" />
                  <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-xs text-slate-400 italic">Historical curve populates as you build and close outstanding tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Distribution visual breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="distributions">
        {/* Priority Pizza Wheel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-slate-500" /> Priority Distributions
          </span>
          <div className="h-44 flex items-center justify-center">
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">Set priorities inside task creations to unlock metrics.</p>
            )}
          </div>
          <div className="flex justify-center gap-4 text-xs font-semibold">
            {priorityData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[item.name] || COLORS[idx] }} />
                <span className="text-slate-600 font-medium">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-slate-500" /> Category Breakdown
          </span>
          <div className="h-44 flex items-center justify-center" id="category-chart-container">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "10px" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Task Count">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400 italic">No custom category breakdown. Categorize some items to showcase.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="flex items-center justify-center">
      <svg className="animate-spin h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}
