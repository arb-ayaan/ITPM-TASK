import React, { useState, useEffect } from "react";
import { Users, Mail, CheckCircle2, AlertCircle, Plus, Trash2, Shield, Lock } from "lucide-react";

interface TeamMember {
  id: string;
  email: string;
  role: "Admin" | "Member";
  status: "Active" | "Pending";
  addedAt: string;
}

interface TeamProps {
  onTriggerToast: (text: string, type: "success" | "error" | "info") => void;
}

export default function Team({ onTriggerToast }: TeamProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"Admin" | "Member">("Member");
  const [isAdding, setIsAdding] = useState(false);
  

  const loggedInUser = JSON.parse(localStorage.getItem("daily_task_user") || "{}");
  const currentUserEmail = loggedInUser.email || "";

  useEffect(() => {
    const saved = localStorage.getItem("daily_task_team");
    if (saved) {
      try {
        setMembers(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse team", e);
      }
    } else {
      const initial: TeamMember[] = [
        {
          id: "m-1",
          email: "anisur.ayaan@gmail.com",
          role: "Admin",
          status: "Active",
          addedAt: new Date().toISOString()
        }
      ];
      setMembers(initial);
      localStorage.setItem("daily_task_team", JSON.stringify(initial));
    }
  }, []);

  //  check Admin or Member?
  const currentUserMember = members.find(m => m.email === currentUserEmail);
  const isAdmin = currentUserMember?.role === "Admin" || currentUserEmail === "anisur.ayaan@gmail.com";

  const saveMembers = (updated: TeamMember[]) => {
    setMembers(updated);
    localStorage.setItem("daily_task_team", JSON.stringify(updated));
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      onTriggerToast("Only Admins can invite new members.", "error");
      return;
    }

    if (!newEmail.trim() || !newEmail.includes("@")) {
      onTriggerToast("Please enter a valid email address.", "error");
      return;
    }
    
    if (members.some(m => m.email === newEmail.trim())) {
      onTriggerToast("This user is already in the team or has been invited.", "info");
      return;
    }

    setIsAdding(false);
    onTriggerToast("Sending invitation...", "info");

    try {
      const response = await fetch('https://api.arbsofttech.com/api/create-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), role: newRole })
      });

      if (response.ok) {
        const newMember: TeamMember = {
          id: "m-" + Date.now(),
          email: newEmail.trim(),
          role: newRole,
          status: "Pending",
          addedAt: new Date().toISOString()
        };
        saveMembers([...members, newMember]);
        setNewEmail("");
        onTriggerToast(`Invitation email sent to ${newMember.email}`, "success");
      } else {
        onTriggerToast("Failed to send invitation email.", "error");
      }
    } catch (error) {
      onTriggerToast("Server error. Ensure backend is running.", "error");
    }
  };

  const handleRemove = (id: string, email: string) => {
    if (!isAdmin) {
      onTriggerToast("Only Admins can remove members.", "error");
      return;
    }
    if (email === "anisur.ayaan@gmail.com") {
      onTriggerToast("You cannot remove the owner.", "error");
      return;
    }
    saveMembers(members.filter(m => m.id !== id));
    onTriggerToast("Member removed.", "info");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Team Members</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your team and workspace access.</p>
        </div>
        
        {/* Admin হলে বাটন কাজ করবে, Member হলে বাটন Disabled থাকবে */}
        {isAdmin ? (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            {isAdding ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isAdding ? "Cancel" : "Invite Member"}</span>
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed shadow-none"
            title="Only Admins can invite members"
          >
            <Lock className="w-4 h-4" />
            <span>Invite Member (Admin Only)</span>
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <form onSubmit={handleInvite} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-sm font-bold text-slate-700 mb-4 tracking-wide uppercase">Send Invitation</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-700 font-medium"
                  autoFocus
                />
                <Mail className="w-4 h-4 absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            
            <div className="w-full md:w-48 flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as "Admin" | "Member")}
                className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 text-slate-700 font-medium"
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-sm transition-all shadow-sm">
              Send Invite
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-5">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length > 0 ? (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold uppercase shrink-0 ${
                          member.status === "Active" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {member.email.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{member.email}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            Added {new Date(member.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 w-fit px-2.5 py-1 rounded-md">
                        {member.role === "Admin" ? <Shield className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.status === "Pending" ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 w-fit px-2.5 py-1 rounded-md border border-amber-100/50">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Pending
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100/50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleRemove(member.id, member.email)}
                        className={`p-2 rounded-lg transition-colors ${
                          isAdmin && member.email !== "anisur.ayaan@gmail.com" 
                            ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-95" 
                            : "text-slate-300 cursor-not-allowed opacity-50"
                        }`}
                        disabled={!isAdmin || member.email === "anisur.ayaan@gmail.com"}
                        title={!isAdmin ? "Only Admins can remove" : member.email === "anisur.ayaan@gmail.com" ? "Cannot remove owner" : "Remove user"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}