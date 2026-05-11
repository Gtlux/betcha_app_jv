import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification, { ToastType } from '@/components/ui/ToastNotification';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  duration: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
    duration: 3000,
  });

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3000) => {
      setToast({ message, type, visible: true, duration });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
        duration={toast.duration}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast turi būti naudojamas ToastProvider viduje');
  }
  return ctx;
}
