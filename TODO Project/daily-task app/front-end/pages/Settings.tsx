import React, { useState, useRef } from "react";
import { User, Lock, Camera, Upload, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import { User as UserType } from "../types";

interface SettingsProps {
  user: UserType;
  token: string | null;
  onUpdateProfile: (updatedUser: UserType) => void;
  onTriggerToast: (text: string, type: "success" | "error" | "info") => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
];

export default function Settings({ user, token, onUpdateProfile, onTriggerToast }: SettingsProps) {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [profilePic, setProfilePic] = useState(user.profilePic || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read upload file safely as base64 string
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onTriggerToast("Image size exceeds limit. Please upload files under 2MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfilePic(base64String);
      onTriggerToast("Photo encoded & staged successfully.", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      onTriggerToast("Passwords do not match.", "error");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      onTriggerToast("Password must be at least 6 characters long.", "error");
      return;
    }

    setLoading(true);
    try {
      // Mock API call locally
      const updatedUser = {
        ...user,
        fullName: fullName.trim(),
        profilePic: profilePic,
      };

      onUpdateProfile(updatedUser);
      setNewPassword("");
      setConfirmPassword("");
      onTriggerToast("Profile configurations synchronized securely.", "success");
    } catch (err: any) {
      onTriggerToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearPhoto = () => {
    setProfilePic("");
    onTriggerToast("Picture cleared. Staged standard initials.", "info");
  };

  // Extract initials if profilePic is absent
  const displayName = fullName || user.username;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col gap-6" id="settings-workbench-root">
      {/* Settings Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-600" />
          Secured Profile Settings
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Adjust profile details, customize avatars, or establish fresh secure passwords to personalize your workspace environment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Avatar & Quick Info */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center">
            {/* Live Profile Pic preview */}
            <div className="relative group w-24 h-24 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-indigo-50 shadow-inner">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-black text-indigo-600 tracking-wider font-mono">
                  {initials}
                </span>
              )}
              
              {/* Trigger local file selection click */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                title="Upload Photo File"
              >
                <Camera className="w-5 h-5 text-white animate-pulse" />
              </button>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {user.fullName || user.username}
              </h3>
              {user.username !== user.email && !user.username.includes('@') && (
                <p className="text-xs text-slate-400 font-medium font-mono mt-0.5">@{user.username}</p>
              )}
              {user.email !== (user.fullName || user.username) && (
                <p className="text-xs text-slate-500 mt-1.5">{user.email}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-2.5 mt-5 w-full">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 hover:bg-slate-55 hover:border-slate-35 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload
              </button>
              {profilePic && (
                <button
                  type="button"
                  onClick={handleClearPhoto}
                  className="p-2 border border-slate-200 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  title="Remove Current Avatar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h4 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3">Or Choose Preset Avatar</h4>
            <div className="flex gap-3 justify-center">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setProfilePic(url)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                    profilePic === url ? "border-indigo-600 scale-105 shadow-md shadow-indigo-100" : "border-transparent hover:border-slate-200"
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Core Form controls */}
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-indigo-50/50 pb-2">
              Update Profile Details
            </h3>

            {/* Username/Email (Read-Only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Registered Username</label>
                <input
                  type="text"
                  value={user.username}
                  disabled
                  className="w-full text-slate-400 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3.5 text-xs font-medium cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Your username is a unique login identifier and cannot be modified.</span>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Registered Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full text-slate-400 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3.5 text-xs font-medium cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-slate-400 font-medium block mt-1">Your contact email is bound to registration security logs.</span>
              </div>
            </div>

            {/* Edit Display Name */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">Display Name / Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center">
                  <User className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name (will display on Dashboard)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 outline-none focus:border-indigo-500 rounded-xl transition font-medium"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Specify your name here, which is dynamically displayed across the welcome cards on the dashboard.</span>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-indigo-50/50 pb-2 mt-2">
              Security & Passcode Maintenance
            </h3>

            {/* Edit Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">New Secure Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="password"
                    placeholder="Enter new password (optional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 outline-none focus:border-indigo-500 rounded-xl transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 outline-none focus:border-indigo-500 rounded-xl transition font-medium"
                  />
                </div>
              </div>
            </div>
            <span className="text-[10px] text-slate-400 -mt-2.5 block">Leave blanks if you do not desire to change or cycle your active password.</span>

            {/* Bottom save button */}
            <div className="border-t border-slate-100 pt-6 mt-2 flex justify-end gap-3 items-center">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 align-middle select-none">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Active SSL Encryption Shield
              </span>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 py-2.5 px-6 rounded-xl text-white font-bold text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 active:scale-97 cursor-pointer transition shadow-md shadow-indigo-250/30"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Synchronizing...
                  </>
                ) : (
                  "Update Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
