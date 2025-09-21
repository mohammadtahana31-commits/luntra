import React from 'react';

interface AutomaticModeToggleProps {
  isAutomatic: boolean;
  setIsAutomatic: (isAutomatic: boolean) => void;
  isDisabled?: boolean;
}

const AutomaticIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:ml-2 ltr:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const ManualIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rtl:ml-2 ltr:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const AutomaticModeToggle: React.FC<AutomaticModeToggleProps> = ({ isAutomatic, setIsAutomatic, isDisabled = false }) => {
  const commonClasses = "flex-1 text-center text-sm font-semibold py-2 px-4 rounded-md transition-all duration-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#161B22] focus:ring-[#33D7FF]";
  const activeClasses = "bg-[#33D7FF] text-[#0D1117] shadow-lg shadow-[#33D7FF]/20";
  const inactiveClasses = "bg-transparent text-[#8B949E] hover:bg-[#33D7FF]/10 hover:text-[#E6EDF3]";

  return (
    <div 
        className={`flex items-center p-1 space-x-1 rtl:space-x-reverse rounded-lg bg-[#0D1117] border border-[#30363D] ${isDisabled ? 'opacity-50' : ''}`}
        role="radiogroup"
        aria-label="حالت انتخاب تکنیک"
    >
        <button
            type="button"
            onClick={() => !isDisabled && setIsAutomatic(true)}
            disabled={isDisabled}
            className={`${commonClasses} ${isAutomatic ? activeClasses : inactiveClasses}`}
            role="radio"
            aria-checked={isAutomatic}
        >
            <AutomaticIcon />
            <span>خودکار</span>
        </button>
        <button
            type="button"
            onClick={() => !isDisabled && setIsAutomatic(false)}
            disabled={isDisabled}
            className={`${commonClasses} ${!isAutomatic ? activeClasses : inactiveClasses}`}
            role="radio"
            aria-checked={!isAutomatic}
        >
            <ManualIcon />
            <span>دستی</span>
        </button>
    </div>
  );
};

export default AutomaticModeToggle;