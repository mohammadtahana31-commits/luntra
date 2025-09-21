import React, { useState, useRef, useEffect } from 'react';

interface TechniqueSelectorProps {
  allTechniques: string[];
  selectedTechniques: string[];
  onChange: (selected: string[]) => void;
  isDisabled?: boolean;
}

const TechniqueSelector: React.FC<TechniqueSelectorProps> = ({
  allTechniques,
  selectedTechniques,
  onChange,
  isDisabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  const handleRemoveTechnique = (technique: string) => {
    onChange(selectedTechniques.filter(t => t !== technique));
  };

  const handleSelectTechnique = (technique: string) => {
    if (!selectedTechniques.includes(technique)) {
      onChange([...selectedTechniques, technique]);
    }
    setSearchTerm(''); // Clear search after selection
  };
  
  const filteredTechniques = allTechniques
    .filter(t => !selectedTechniques.includes(t))
    .filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className={`w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-2 flex items-center flex-wrap gap-2 min-h-[48px] transition-all duration-200 ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text focus-within:ring-2 focus-within:ring-[#33D7FF] focus-within:border-[#33D7FF]'}`}
        onClick={() => !isDisabled && setIsOpen(true)}
      >
        {selectedTechniques.map(technique => (
          <span key={technique} className="flex items-center bg-[#33D7FF]/20 text-[#33D7FF] text-xs font-semibold px-2 py-1 rounded-full animate-fade-in">
            {technique}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); 
                handleRemoveTechnique(technique);
              }}
              className="ml-2 rtl:mr-2 rtl:ml-0 text-red-400 hover:text-red-600 font-bold text-lg leading-none transition-colors"
              aria-label={`Remove ${technique}`}
            >
              &times;
            </button>
          </span>
        ))}
        <div className="flex-grow min-w-[150px]" onClick={() => !isDisabled && setIsOpen(true)}>
          {!selectedTechniques.length && <span className="text-[#8B949E] text-sm pointer-events-none">تکنیک‌ها را انتخاب کنید...</span>}
        </div>
        <button
            type="button"
            onClick={() => !isDisabled && setIsOpen(!isOpen)}
            className="text-[#8B949E] hover:text-white transition-colors"
            aria-label={isOpen ? 'بستن لیست' : 'باز کردن لیست'}
        >
            <svg className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </div>
      
      {isOpen && !isDisabled && (
        <div className="absolute z-20 w-full mt-2 bg-[#161B22] border border-[#30363D] rounded-lg shadow-2xl max-h-60 flex flex-col">
          <div className="p-2 sticky top-0 bg-[#161B22]/80 backdrop-blur-sm border-b border-[#30363D]">
            <input
              type="text"
              placeholder="جستجوی تکنیک..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-md p-2 text-sm focus:ring-1 focus:ring-[#33D7FF] focus:border-[#33D7FF] outline-none"
              autoFocus
            />
          </div>
          <ul className="overflow-y-auto">
            {filteredTechniques.length > 0 ? (
                filteredTechniques.map(technique => (
                <li
                  key={technique}
                  onClick={() => handleSelectTechnique(technique)}
                  className="px-4 py-2 text-sm text-[#E6EDF3] hover:bg-[#33D7FF]/10 cursor-pointer transition-colors"
                  role="option"
                  aria-selected="false"
                >
                  {technique}
                </li>
              ))
            ) : (
                <li className="px-4 py-2 text-sm text-[#8B949E]">
                    موردی یافت نشد.
                </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TechniqueSelector;
