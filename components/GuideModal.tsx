import React, { useState, useMemo } from 'react';
import { PROMPT_TECHNIQUES } from '../constants';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');

  const filteredTechniques = useMemo(() => {
    const lowercasedFilter = searchTerm.toLowerCase().trim();
    if (!lowercasedFilter) {
      return Object.entries(PROMPT_TECHNIQUES);
    }
    return Object.entries(PROMPT_TECHNIQUES).filter(([technique, description]) => 
      technique.toLowerCase().includes(lowercasedFilter) || 
      description.toLowerCase().includes(lowercasedFilter)
    );
  }, [searchTerm]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-[#30363D] sticky top-0 bg-[#161B22]/80 backdrop-blur-sm z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#E6EDF3]">راهنمای تکنیک‌های پرامت</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#8B949E] rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-3">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="جستجو در نام یا توضیحات تکنیک..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg py-2 pl-10 pr-3 rtl:pr-10 rtl:pl-3 focus:ring-2 focus:ring-[#33D7FF] focus:border-[#33D7FF] transition-all duration-200 text-[#E6EDF3]"
              aria-label="جستجوی تکنیک"
            />
          </div>
        </header>
        <div className="overflow-y-auto p-6">
          {filteredTechniques.length > 0 ? (
            <ul className="space-y-6">
              {filteredTechniques.map(([technique, description]) => (
                <li key={technique} className="border-b border-[#30363D] pb-4 last:border-b-0">
                  <h3 className="text-lg font-semibold text-[#33D7FF] mb-1">{technique}</h3>
                  <p className="text-[#E6EDF3] leading-relaxed">{description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <p className="text-[#8B949E]">هیچ تکنیکی مطابق با جستجوی شما یافت نشد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuideModal;