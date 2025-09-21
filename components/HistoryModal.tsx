
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { stripHtml } from '../utils/domUtils';
import { PROMPT_CATEGORIES } from '../constants';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
  onToggleFavorite: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ 
    isOpen, onClose, history, onSelect, onClear, onToggleFavorite, onAddTag, onRemoveTag
}) => {
  const [filter, setFilter] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const handleTagInputChange = (itemId: string, value: string) => {
      setTagInput(prev => ({ ...prev, [itemId]: value }));
  };

  const handleTagSubmit = (e: React.FormEvent, itemId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const newTag = tagInput[itemId] || '';
      if (newTag.trim()) {
          onAddTag(itemId, newTag.trim());
          setTagInput(prev => ({ ...prev, [itemId]: '' }));
      }
  };

  const filteredAndSortedHistory = useMemo(() => {
    const now = Date.now();
    return history
      .filter(item => {
        if (dateFilter === 'all') return true;
        const itemAge = now - item.timestamp;
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === 'today' && itemAge > oneDay) return false;
        if (dateFilter === '7days' && itemAge > 7 * oneDay) return false;
        if (dateFilter === '30days' && itemAge > 30 * oneDay) return false;
        return true;
      })
      .filter(item => categoryFilter === 'all' || item.category === categoryFilter)
      .filter(item => !showOnlyFavorites || item.isFavorite)
      .filter(item => {
        const searchTerm = filter.toLowerCase();
        if (!searchTerm) return true;
        const inPrompt = stripHtml(item.originalPrompt).toLowerCase().includes(searchTerm);
        const inTags = item.tags?.some(tag => tag.toLowerCase().includes(searchTerm));
        return inPrompt || inTags;
      })
      .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0) || b.timestamp - a.timestamp);
  }, [history, filter, showOnlyFavorites, categoryFilter, dateFilter]);

  const handleExport = () => {
    const dataStr = JSON.stringify(filteredAndSortedHistory, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luntra_history_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="p-5 border-b border-[#30363D] sticky top-0 bg-[#161B22]/80 backdrop-blur-sm z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#E6EDF3]">تاریخچه</h2>
            <div>
              {history.length > 0 && <button onClick={onClear} className="text-sm bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded transition-colors duration-200 ml-4">پاک کردن تاریخچه</button>}
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl inline-flex items-center justify-center w-8 h-8">&times;</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="جستجو در پرامت یا تگ‌ها..." value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-2 focus:ring-2 focus:ring-[#33D7FF] focus:border-[#33D7FF] transition-all duration-200"/>
            <div className="grid grid-cols-2 gap-4">
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-2 focus:ring-2 focus:ring-[#33D7FF] focus:border-[#33D7FF] transition-all duration-200 text-sm">
                    <option value="all">همه دسته‌بندی‌ها</option>
                    {PROMPT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-2 focus:ring-2 focus:ring-[#33D7FF] focus:border-[#33D7FF] transition-all duration-200 text-sm">
                    <option value="all">همه زمان‌ها</option>
                    <option value="today">امروز</option>
                    <option value="7days">هفته گذشته</option>
                    <option value="30days">ماه گذشته</option>
                </select>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setShowOnlyFavorites(!showOnlyFavorites)} className={`flex-shrink-0 text-sm py-2 px-4 rounded-lg border transition-all duration-200 flex items-center gap-2 ${showOnlyFavorites ? 'bg-[#33D7FF] text-[#0D1117] border-[#33D7FF]' : 'bg-transparent border-[#30363D] hover:bg-[#33D7FF]/10 text-[#E6EDF3]'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    <span>{showOnlyFavorites ? 'نمایش همه' : 'فقط دلخواه'}</span>
                </button>
                {filteredAndSortedHistory.length > 0 && <button onClick={handleExport} className="text-sm py-2 px-4 rounded-lg border border-[#30363D] hover:bg-[#33D7FF]/10 text-[#E6EDF3] transition-all duration-200">خروجی JSON</button>}
            </div>
          </div>
        </header>
        <div className="overflow-y-auto p-6">
          {filteredAndSortedHistory.length === 0 ? (<p className="text-center text-[#8B949E]">{history.length > 0 ? 'هیچ موردی با فیلترهای شما مطابقت ندارد.' : 'تاریخچه‌ای وجود ندارد.'}</p>) : (
            <ul className="space-y-4">{filteredAndSortedHistory.map((item) => (
                <li key={item.id} className="bg-transparent p-4 rounded-lg transition-colors border border-[#30363D] hover:bg-[#33D7FF]/5">
                  <div onClick={() => onSelect(item)} className="cursor-pointer">
                    <p className="font-mono text-sm text-[#E6EDF3] truncate" title={stripHtml(item.originalPrompt)}>{stripHtml(item.originalPrompt)}</p>
                    <div className="text-xs text-[#8B949E] mt-2 flex justify-between items-center">
                      <div><span className="inline-block bg-[#33D7FF]/10 text-[#33D7FF] py-1 px-2 rounded-md mr-2">{item.category}</span><span>{item.outputs.length} تکنیک</span></div>
                      <span>{new Date(item.timestamp).toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#30363D] flex justify-between items-end gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 flex-wrap mb-2">{item.tags?.map(tag => (<span key={tag} className="flex items-center bg-[#30363D] text-xs text-[#33D7FF] py-1 pr-2 pl-1 rounded-full">{tag}<button onClick={(e) => { e.stopPropagation(); onRemoveTag(item.id, tag); }} className="ml-1 text-red-400 hover:text-red-600 font-bold text-lg leading-none">&times;</button></span>))}</div>
                      <form onSubmit={(e) => handleTagSubmit(e, item.id)} className="flex items-center">
                        <input type="text" placeholder="افزودن تگ..." value={tagInput[item.id] || ''} onClick={e => e.stopPropagation()} onChange={e => handleTagInputChange(item.id, e.target.value)} className="bg-transparent border-b border-[#30363D] focus:border-[#33D7FF] text-xs py-1 px-1 outline-none w-24 text-white"/>
                        <button type="submit" onClick={e => e.stopPropagation()} className="text-xs bg-[#33D7FF]/20 hover:bg-[#33D7FF]/40 text-white rounded-md px-2 py-1 ml-2">افزودن</button>
                      </form>
                    </div>
                    <div className="flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }} className="text-[#33D7FF] hover:scale-110 transition-transform p-1">{item.isFavorite ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#33D7FF]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-gray-500 hover:text-[#33D7FF]"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345h5.364c.54 0 .823.734.416 1.14l-4.25 3.097a.563.563 0 0 0-.184.62l2.125 5.111a.563.563 0 0 1-.809.678l-4.25-3.097a.563.563 0 0 0-.62 0l-4.25 3.097a.563.563 0 0 1-.809-.678l2.125-5.111a.563.563 0 0 0-.184-.62l-4.25-3.097a.563.563 0 0 1 .416-1.14h5.364a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>)}</button>
                    </div>
                  </div>
                </li>))}</ul>)}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;