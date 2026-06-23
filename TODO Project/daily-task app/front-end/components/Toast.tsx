import React, { useEffect } from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export default function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="fixed top-6 right-6 z-50 flex items-center gap-3 w-full max-w-sm px-4 py-3.5 bg-white rounded-xl shadow-lg border border-slate-100"
          id={`toast-${toast.id}`}
        >
          {toast.type === "success" && (
            <div className="p-1 bg-emerald-50 rounded-lg text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          )}
          {toast.type === "error" && (
            <div className="p-1 bg-rose-50 rounded-lg text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          {toast.type === "info" && (
            <div className="p-1 bg-blue-50 rounded-lg text-blue-500">
              <Info className="w-5 h-5" />
            </div>
          )}
          
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">{toast.text}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-50 transition"
            aria-label="Close notification"
            id={`toast-close-${toast.id}`}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
