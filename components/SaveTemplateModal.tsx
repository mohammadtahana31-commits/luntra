import React, { useState, useEffect } from 'react';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-5 border-b border-[#30363D]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-[#E6EDF3]">ذخیره به عنوان الگو</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl">&times;</button>
          </div>
        </header>
        <div className="p-6 space-y-4">
            <label htmlFor="template-name" className="block text-sm font-medium text-[#8B949E]">
                یک نام برای این الگو انتخاب کنید تا بعداً بتوانید آن را به راحتی پیدا کنید.
            </label>
            <input
              id="template-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الگوی خلاصه‌نویسی کتاب"
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 focus:ring-2 focus:ring-[#33D7FF] focus:border-[#33D7FF] transition-all duration-200"
              autoFocus
            />
        </div>
        <footer className="p-4 bg-[#0D1117]/50 border-t border-[#30363D] flex justify-end gap-3 rounded-b-2xl">
            <button 
                onClick={onClose} 
                className="py-2 px-4 rounded-lg border border-[#30363D] hover:bg-[#30363D]/50 text-[#E6EDF3] transition-colors"
            >
                انصراف
            </button>
            <button 
                onClick={handleSave} 
                disabled={!name.trim()}
                className="py-2 px-4 rounded-lg bg-[#33D7FF] text-[#0D1117] font-bold hover:bg-[#44E8FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                ذخیره الگو
            </button>
        </footer>
      </div>
    </div>
  );
};

export default SaveTemplateModal;
