import React, { useEffect, useState } from 'react';
import { toastManager, type Toast } from '../services/toast';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const getToastStyles = (type: Toast['type']) => {
    const baseStyle =
      'animate-slideIn fixed px-6 py-4 rounded-lg shadow-lg text-white font-semibold';
    switch (type) {
      case 'success':
        return `${baseStyle} bg-green-500`;
      case 'error':
        return `${baseStyle} bg-red-500`;
      case 'warning':
        return `${baseStyle} bg-yellow-500`;
      default:
        return `${baseStyle} bg-blue-500`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={getToastStyles(toast.type)}
          style={{
            animation: 'slideIn 0.3s ease-out',
            marginTop: `${index * 80}px`,
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
