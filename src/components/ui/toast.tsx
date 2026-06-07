"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (title: string, description?: string, type?: ToastType) => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (title: string, description?: string, type: ToastType = "success", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, removeToast }: { toasts: ToastMessage[]; removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div className={cn(
      "flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg bg-surface border-border-custom transition-all duration-300 animate-slide-in-bottom",
      {
        "border-l-4 border-l-emerald-500": toast.type === "success",
        "border-l-4 border-l-red-500": toast.type === "error",
        "border-l-4 border-l-primary": toast.type === "info"
      }
    )}>
      {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />}
      {toast.type === "error" && <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />}
      {toast.type === "info" && <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
      
      <div className="flex-1 flex flex-col">
        <h4 className="text-sm font-semibold text-text-primary">{toast.title}</h4>
        {toast.description && (
          <p className="text-xs text-text-secondary mt-1 leading-normal">{toast.description}</p>
        )}
      </div>

      <button onClick={onClose} className="text-text-muted hover:text-text-primary cursor-pointer p-0.5 rounded hover:bg-surface-secondary transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
