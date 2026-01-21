import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icons } from '../components/Icons';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[100] flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full duration-300 ${
              toast.type === 'success' 
                ? 'bg-white dark:bg-gray-900 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' 
                : toast.type === 'error'
                ? 'bg-white dark:bg-gray-900 border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-white dark:bg-gray-900 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'
            }`}
          >
            <div className={`p-1 rounded-full ${
                toast.type === 'success' ? 'bg-green-100 dark:bg-green-900/50' : 
                toast.type === 'error' ? 'bg-red-100 dark:bg-red-900/50' : 'bg-blue-100 dark:bg-blue-900/50'
            }`}>
                 {toast.type === 'success' ? <Icons.BadgeCheck className="w-4 h-4" /> : 
                  toast.type === 'error' ? <Icons.AlertCircle className="w-4 h-4" /> : <Icons.Info className="w-4 h-4" />}
            </div>
            <p className="text-sm font-bold pr-2">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
