import React from 'react';
import { PromptTemplate } from '../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: PromptTemplate[];
  onLoad: (template: PromptTemplate) => void;
  onDelete: (id: string) => void;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ isOpen, onClose, templates, onLoad, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-[#30363D] sticky top-0 bg-[#161B22]/80 backdrop-blur-sm z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-[#E6EDF3]">الگوهای شما</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
          </div>
        </header>
        <div className="overflow-y-auto p-6">
          {templates.length === 0 ? (
            <p className="text-center text-[#8B949E]">هیچ الگویی ذخیره نشده است.</p>
          ) : (
            <ul className="space-y-3">
              {templates.map((template) => (
                <li 
                  key={template.id} 
                  className="bg-transparent p-4 rounded-lg border border-[#30363D] flex justify-between items-center gap-4 transition-all hover:border-[#33D7FF]/50"
                >
                  <div>
                    <h3 className="font-semibold text-md text-[#E6EDF3]">{template.name}</h3>
                    <p className="text-xs text-[#8B949E] mt-1">
                      <span className="inline-block bg-[#33D7FF]/10 text-[#33D7FF] py-0.5 px-2 rounded-md">{template.category}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => onLoad(template)}
                      className="text-sm bg-[#33D7FF]/10 hover:bg-[#33D7FF]/20 text-[#33D7FF] font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      بارگذاری
                    </button>
                    <button 
                      onClick={() => onDelete(template.id)}
                      className="text-sm bg-red-600/20 hover:bg-red-600/40 text-red-300 font-semibold p-2 rounded-lg transition-colors"
                      aria-label={`Delete template ${template.name}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;
