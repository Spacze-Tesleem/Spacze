'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/** Auto-dismissing toast stack rendered at the bottom-right of the viewport. */
export function ToastStack({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0,  scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-xs text-sm ${
        isSuccess
          ? 'bg-[#00D67D]/10 border-[#00D67D]/25 text-[#00D67D]'
          : 'bg-red-500/10 border-red-500/25 text-red-400'
      }`}
    >
      {isSuccess
        ? <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
        : <AlertCircle  size={15} className="flex-shrink-0 mt-0.5" />
      }
      <span className="flex-1 leading-snug admin-text text-[12px]">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity">
        <X size={13} />
      </button>
    </motion.div>
  );
}

/** Hook to manage a toast queue. */
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  function toast(type: ToastType, message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
  }

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

  return { toasts, toast, dismiss };
}
