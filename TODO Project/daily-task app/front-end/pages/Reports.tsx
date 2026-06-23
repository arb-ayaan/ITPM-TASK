import React, { useState } from "react";
import { FileText, Download, Calendar, TrendingUp, CheckSquare, Award, Clock, ArrowUpRight } from "lucide-react";
import { Task, User } from "../types";
import { jsPDF } from "jspdf";

interface ReportsProps {
  tasks: Task[];
  user: User;
  onTriggerToast: (text: string, type: "success" | "error" | "info") => void;
}

export default function Reports({ tasks, user, onTriggerToast }: ReportsProps) {
  const [activeReportTab, setActiveReportTab] = useState<"weekly" | "monthly" | "yearly">("weekly");
  const [downloading, setDownloading] = useState<string | null>(null);

  // Compute stats based on selected period
  const getPeriodDays = (period: "weekly" | "monthly" | "yearly") => {
    if (period === "weekly") return 7;
    if (period === "monthly") return 30;
    return 365;
  };

  const days = getPeriodDays(activeReportTab);
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const periodTasks = tasks.filter((t) => {
    const createdDate = new Date(t.createdAt);
    return createdDate >= startDate && createdDate <= now;
  });

  const total = periodTasks.length;
  const completed = periodTasks.filter((t) => t.status === "Completed").length;
  const pending = periodTasks.filter((t) => t.status === "Pending").length;
  const progressRatio = total > 0 ? Math.round((completed / total) * 100) : 0;

  const highPriorityCount = periodTasks.filter((t) => t.priority === "High").length;
  const mediumPriorityCount = periodTasks.filter((t) => t.priority === "Medium").length;
  const lowPriorityCount = periodTasks.filter((t) => t.priority === "Low").length;

  const generatePDF = async (period: "weekly" | "monthly" | "yearly") => {
    setDownloading(period);
    onTriggerToast(`Structuring list & compiling PDF for custom ${period} view...`, "info");

    try {
      // Simulate slight compilation lag for smooth UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      const doc = new jsPDF();
      const periodDays = getPeriodDays(period);
      const start = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      
      const filtered = tasks.filter((t) => {
        const cDate = new Date(t.createdAt);
        return cDate >= start && cDate <= now;
      });

      const tCount = filtered.length;
      const cCount = filtered.filter((t) => t.status === "Completed").length;
      const pCount = filtered.filter((t) => t.status === "Pending").length;
      const pRatio = tCount > 0 ? Math.round((cCount / tCount) * 100) : 0;

      const hp = filtered.filter((t) => t.priority === "High").length;
      const mp = filtered.filter((t) => t.priority === "Medium").length;
      const lp = filtered.filter((t) => t.priority === "Low").length;

      // Header Rectangle Banner
      doc.setFillColor(79, 70, 229); // Beautiful Indigo-600 color
      doc.rect(0, 0, 210, 42, "F");

      // White header text
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("DAILY TASK - PERFORMANCE REPORT", 15, 20);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(200, 201, 255);
      doc.text(`AUTOMATED SYSTEM PERFORMANCE AUDIT • STATUS: SECURED EXPORT`, 15, 28);
      
      const rangeString = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      doc.text(`TIMEFRAME DURATION: ${period.toUpperCase()} VIEW (${rangeString})`, 15, 34);

      // Reset Text Colors
      doc.setTextColor(30, 41, 59);

      // Section 1: Meta Properties
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.text("1. REPORT PROPERTIES & METRIC IDENTIFIERS", 15, 54);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Account Username: ${user.username}`, 15, 62);
      doc.text(`Display Name: ${user.fullName || "Unconfigured Profile"}`, 15, 68);
      doc.text(`Registered Identity Email: ${user.email}`, 15, 74);
      doc.text(`Date of Compilation Summary: ${now.toUTCString()}`, 15, 80);

      // Section 2: Summary Stats Dashboard Block
      doc.setFillColor(248, 250, 252); // soft off-white
      doc.setDrawColor(226, 232, 240); // borders
      doc.setLineWidth(0.5);
      doc.roundedRect(15, 88, 180, 42, 3, 3, "FD");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(79, 70, 229); // Indigo
      doc.text("EXECUTIVE PERFORMANCE INDICATOR SUMMARY", 20, 96);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Total Logged Tasks in Scope: ${tCount}`, 20, 105);
      doc.text(`Completed Tasks Closed: ${cCount}`, 20, 112);
      doc.text(`Active Outstanding Pending: ${pCount}`, 20, 119);

      // Completion Progression bar logic
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(110, 110, 75, 4, 2, 2, "F");
      if (pRatio > 0) {
        doc.setFillColor(34, 197, 94); // emerald positive progress
        doc.roundedRect(110, 110, (75 * pRatio) / 100, 4, 2, 2, "F");
      }
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(`PROGRESS RANK: ${pRatio}%`, 110, 105);

      // Section 3: Priority Metrics Distribution
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("2. PRIORITY ZONE CONGESTION CRITIQUE", 15, 144);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Red Line (High Priority Targets) Count: ${hp} tasks queued.`, 15, 151);
      doc.text(`Amber Zone (Medium Priority Targets) Count: ${mp} tasks queued.`, 15, 157);
      doc.text(`Blue Route (Low Priority Targets) Count: ${lp} tasks queued.`, 15, 163);

      // Section 4: Grid table of task logs
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text("3. TIMELINE AUDITING LOG (UP TO 12 ITEMS)", 15, 175);

      let tableY = 183;
      doc.setFillColor(241, 245, 249); // slate-100 header
      doc.rect(15, tableY, 180, 8, "F");

      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text("TASK TITLE SUMMARY", 18, tableY + 5.5);
      doc.text("CATEGORY", 95, tableY + 5.5);
      doc.text("PRIORITY", 140, tableY + 5.5);
      doc.text("STATUS", 172, tableY + 5.5);

      tableY += 8;
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 116, 139);

      const itemsToShow = filtered.slice(0, 12);
      if (itemsToShow.length === 0) {
        doc.text("No task records located during this specific historical phase.", 18, tableY + 6);
      } else {
        itemsToShow.forEach((task, index) => {
          // Zebra striping
          if (index % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(15, tableY, 180, 7.5, "F");
          }
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);
          // Truncate title safety
          const title = task.title.length > 40 ? task.title.substring(0, 37) + "..." : task.title;
          doc.text(title, 18, tableY + 5);
          doc.text(task.category || "Personal", 95, tableY + 5);
          doc.text(task.priority, 140, tableY + 5);
          doc.text(task.status, 172, tableY + 5);
          tableY += 7.5;
        });
      }

      // Elegant Footer
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(15, 275, 195, 275);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text("PDF Generation securely completed by the Daily Task Productivity Reporting Node.", 15, 280);
      doc.text("Confidential Personal Productivity Logs • Page 1 of 1", 125, 280);

      doc.save(`daily_task_${period}_report.pdf`);
      onTriggerToast(`Performance audit downloaded: ${period}_report.pdf`, "success");
    } catch (err) {
      console.error(err);
      onTriggerToast("PDF rendering hit a memory compilation issue.", "error");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-6" id="reports-module-root">
      {/* Upper header section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Performance Reports Workshop
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Analyze historical task compliance metrics across adjustable scales and export official print-ready PDF summaries.
          </p>
        </div>
      </div>

      {/* Main visual partition block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Controls / Buttons */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Select Duration Frame</h3>
            
            <div className="flex flex-col gap-2.5">
              {[
                { id: "weekly", title: "Weekly Audit", span: "7 Days Back" },
                { id: "monthly", title: "Monthly Audit", span: "30 Days Back" },
                { id: "yearly", title: "Yearly Audit", span: "365 Days Back" },
              ].map((rpt) => (
                <button
                  key={rpt.id}
                  onClick={() => setActiveReportTab(rpt.id as "weekly" | "monthly" | "yearly")}
                  className={`flex items-center justify-between p-4 rounded-xl text-left border transition-all duration-200 ${
                    activeReportTab === rpt.id
                      ? "border-indigo-500 bg-indigo-50/50 text-indigo-900 font-semibold"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={`w-4 h-4 ${activeReportTab === rpt.id ? "text-indigo-600" : "text-slate-400"}`} />
                    <div>
                      <p className="text-sm leading-none">{rpt.title}</p>
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{rpt.span}</span>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 opacity-50" />
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 my-5 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Instant Actions</h3>
              <button
                onClick={() => generatePDF(activeReportTab)}
                disabled={downloading !== null}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 active:scale-97 disabled:opacity-50 transition cursor-pointer shadow-md shadow-indigo-200/50"
              >
                {downloading === activeReportTab ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Compiling PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download {activeReportTab.toUpperCase()} PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview of report structure based on local variables/states */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Mock PDF Header preview */}
            <div className="bg-indigo-600 p-6 text-white relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase bg-indigo-500/30 px-2.5 py-0.5 rounded-full tracking-wide">
                    Live Document Compilation Preview
                  </span>
                  <h3 className="text-lg font-bold mt-2 tracking-tight">DAILY TASK PRODUCTIVITY REPORT</h3>
                </div>
                <Award className="w-8 h-8 text-indigo-200 opacity-60 shrink-0" />
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-indigo-100 text-[11px] mt-4 font-normal">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {days} Days Window Range
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Period: {activeReportTab.toUpperCase()} Performance Audit
                </span>
              </div>
            </div>

            {/* Simulated PDF Body page layout */}
            <div className="p-6 bg-slate-50/50 flex-1 flex flex-col gap-6 text-slate-750">
              {/* Properties log */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">1. Profile Identification properties</h4>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 bg-white rounded-xl p-4 border border-slate-100 shadow-xs text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Username:</span>
                    <p className="font-semibold text-slate-800">{user.username}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Display Name:</span>
                    <p className="font-semibold text-slate-800 text-indigo-600">{user.fullName || "Unconfigured Profile Name"}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Registered Identity Email:</span>
                    <p className="font-semibold text-slate-800">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Report Range limits:</span>
                    <p className="font-semibold text-slate-800">{startDate.toLocaleDateString()} - {now.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Stats overview and progress */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">2. Analytical KPI Scorecards</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-xs text-center flex flex-col items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Total Scope Logs</span>
                    <span className="text-2xl font-black text-slate-800 block">{total}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1">compiled tasks</span>
                  </div>
                  <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-xs text-center flex flex-col items-center">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Completed Items</span>
                    <span className="text-2xl font-black text-emerald-600 block">{completed}</span>
                    <span className="text-[10px] text-slate-400 font-medium mt-1">closed tasks</span>
                  </div>
                  <div className="bg-white p-4 border border-slate-100 rounded-xl shadow-xs text-center flex flex-col items-center">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 block mb-1">Compliance Progress</span>
                    <span className="text-2xl font-black text-indigo-600 block">{progressRatio}%</span>
                    <div className="w-12 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: `${progressRatio}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Priority weights */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">3. Priority weights distribution</h4>
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-xs flex justify-around gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <div>
                      <span className="text-slate-400 text-[10px] block leading-none font-semibold">High Priority</span>
                      <strong className="text-slate-800 text-sm mt-0.5 block">{highPriorityCount}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                    <div>
                      <span className="text-slate-400 text-[10px] block leading-none font-semibold">Medium Priority</span>
                      <strong className="text-slate-800 text-sm mt-0.5 block">{mediumPriorityCount}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <span className="text-slate-400 text-[10px] block leading-none font-semibold">Low Priority</span>
                      <strong className="text-slate-800 text-sm mt-0.5 block">{lowPriorityCount}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent lists */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">4. Context Task Logs included</h4>
                <div className="bg-white border border-slate-150 rounded-xl shadow-xs overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-semibold text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-4">Task Title</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Priority</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periodTasks.slice(0, 5).map((t, index) => (
                        <tr key={index} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-semibold text-slate-700 truncate max-w-xs">{t.title}</td>
                          <td className="py-2 px-4 text-slate-500">{t.category}</td>
                          <td className="py-2 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                              t.priority === "High" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                              t.priority === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-blue-50 text-blue-600 border border-blue-100"
                            }`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === "Completed" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {periodTasks.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 px-4 text-center text-slate-400 italic">
                            No tasks recorded during this period scope. Create some items in Workspace tab!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {periodTasks.length > 5 && (
                    <div className="bg-slate-50 p-2 text-center text-[10px] font-semibold text-slate-400 uppercase border-t border-slate-100">
                      And {periodTasks.length - 5} other tasks indexed inside the downloadable PDF file.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
