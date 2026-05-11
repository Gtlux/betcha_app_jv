// Autorius: JV (Jarek)
import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification, { ToastType } from '@/components/ui/ToastNotification';

/**
 * Būsena, sauganti informaciją apie šiuo metu rodomą Toast pranešimą.
 */
interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
  duration: number;
}

/**
 * ToastContextValue aprašo funkciją, kurią galima iškviesti per useToast hook'ą.
 */
interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * ToastProvider (FR-1)
 * Apgaubia aplikacijos medį ir suteikia galimybę bet kuriam komponentui iškviesti pranešimus.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Pradinė Toast komponento būsena: tuščias tekstas, sėkmės tipas, nematomas
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
    duration: 3000,
  });

  // showToast funkcija atnaujina būseną ir taip iškviečia Toast komponento atvaizdavimą
  // useCallback užtikrina, kad funkcija nebus perkurta kiekvieno renderinimo metu
  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3000) => {
      setToast({ message, type, visible: true, duration });
    },
    [],
  );

  // hideToast funkcija pakeičia visible į false, kas paslepia pranešimą (po animacijos)
  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    // Context Provider padaro showToast funkciją pasiekiamą visiems vaikiniams komponentams
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Pats ToastNotification komponentas egzistuoja tik vieną kartą visoje aplikacijoje */}
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

// Hook'as skirtas komponentams, norintiems iškviesti pranešimą
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Apsauga, jei bandoma naudoti useToast neapgaubus aplikacijos ToastProvider'iu
  if (!ctx) {
    throw new Error('useToast turi būti naudojamas ToastProvider viduje');
  }
  return ctx;
}
