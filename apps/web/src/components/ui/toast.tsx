import React, { useState, useEffect } from 'react';

interface ErrorProps {
  message: string;
  details?: string;
  type?: 'error' | 'warning' | 'info';
  onClose?: () => void;
  className?: string;
  icon?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends ErrorProps {
  id: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Context for managing toasts
const ToastContext = React.createContext<{
  addToast: (props: Omit<ToastProps, 'id'>) => string;
  removeToast: (id: string) => void;
} | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (props: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newToast = { ...props, id };
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Error component that can be used inline
export const ErrorMessage: React.FC<ErrorProps> = ({
  message,
  details,
  type = 'error',
  onClose,
  className = '',
  icon = true,
  action
}) => {
  // Color configurations based on type
  const colors = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-700',
      iconColor: 'text-red-400'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      iconColor: 'text-yellow-400'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-700',
      iconColor: 'text-blue-400'
    }
  };

  const colorConfig = colors[type];

  return (
    <div className={`rounded-md p-4 ${colorConfig.bg} ${colorConfig.border} border ${className}`}>
      <div className="flex items-start">
        {icon && (
          <div className={`mr-3 flex-shrink-0 ${colorConfig.iconColor}`}>
            {type === 'error' && (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {type === 'warning' && (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {type === 'info' && (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
        <div className="flex-grow">
          <h3 className={`text-sm font-medium ${colorConfig.text}`}>{message}</h3>
          {details && <div className={`mt-2 text-sm ${colorConfig.text} opacity-80`}>{details}</div>}
          {action && (
            <div className="mt-3">
              <button
                onClick={action.onClick}
                className={`${colorConfig.text} text-sm font-medium hover:underline focus:outline-none`}
              >
                {action.label}
              </button>
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className={`inline-flex ${colorConfig.iconColor} hover:${colorConfig.text} focus:outline-none`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast container component
const ToastContainer: React.FC<{
  toasts: ToastProps[];
  removeToast: (id: string) => void;
}> = ({ toasts, removeToast }) => {
  // Group toasts by position
  const groupedToasts: Record<string, ToastProps[]> = {
    'top-right': [],
    'top-left': [],
    'bottom-right': [],
    'bottom-left': [],
    'top-center': [],
    'bottom-center': []
  };

  toasts.forEach(toast => {
    const position = toast.position || 'top-right';
    groupedToasts[position].push(toast);
  });

  const positionStyles: Record<string, string> = {
    'top-right': 'top-4 right-4 flex flex-col items-end',
    'top-left': 'top-4 left-4 flex flex-col items-start',
    'bottom-right': 'bottom-4 right-4 flex flex-col items-end',
    'bottom-left': 'bottom-4 left-4 flex flex-col items-start',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center'
  };

  return (
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        positionToasts.length > 0 && (
          <div key={position} className={`fixed z-50 ${positionStyles[position]}`}>
            {positionToasts.map(toast => (
              <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
            ))}
          </div>
        )
      ))}
    </>
  );
};

// Individual toast component
const Toast: React.FC<ToastProps & { onClose: () => void }> = ({
  message,
  details,
  type = 'error',
  duration = 5000,
  onClose,
  action,
  icon = true
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="mb-3 w-full max-w-sm transform transition-all duration-300 ease-in-out animate-fade-in">
      <ErrorMessage
        message={message}
        details={details}
        type={type}
        onClose={onClose}
        className="shadow-lg"
        icon={icon}
        action={action}
      />
    </div>
  );
};
