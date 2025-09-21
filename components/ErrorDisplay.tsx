import React from 'react';

interface ErrorDisplayProps {
  errorMessage: string;
  onDismiss: () => void;
}

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage, onDismiss }) => {
  return (
    <div 
      className="my-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-xl max-w-4xl mx-auto flex items-start space-x-4 rtl:space-x-reverse shadow-lg shadow-red-900/20"
      role="alert"
    >
      <ErrorIcon />
      <div className="flex-1">
        <h3 className="font-bold text-red-300 text-lg mb-1">مشکلی پیش آمد</h3>
        <p className="text-sm">{errorMessage}</p>
        <p className="text-xs mt-2 text-red-300/80">
          لطفاً دوباره تلاش کنید یا در صورت تکرار مشکل، ورودی خود را تغییر دهید.
        </p>
      </div>
      <button 
        onClick={onDismiss} 
        className="text-red-300 hover:text-white transition-colors text-2xl flex-shrink-0"
        aria-label="بستن خطا"
      >
        &times;
      </button>
    </div>
  );
};

export default ErrorDisplay;
