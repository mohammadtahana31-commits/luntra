
import React, { useState, useEffect, useRef } from 'react';

// Components
import Spinner from './components/Spinner';
import PromptCard from './components/PromptCard';
import GuideModal from './components/GuideModal';
import HistoryModal from './components/HistoryModal';
import AutomaticModeToggle from './components/AutomaticModeToggle';
import RichTextInput from './components/RichTextInput';
import ErrorDisplay from './components/ErrorDisplay';
import TechniqueSelector from './components/TechniqueSelector';
import SaveTemplateModal from './components/SaveTemplateModal';
import TemplatesModal from './components/TemplatesModal';

// Services
import { selectTechniques, enhancePrompt, suggestCategory } from './services/geminiService';

// Constants & Types
import { PROMPT_TECHNIQUES, PROMPT_CATEGORIES } from './constants';
import { EnhancedPrompt, HistoryItem, PromptTemplate } from './types';

// Utils
import { stripHtml } from './utils/domUtils';

const PROMPT_DRAFT_KEY = 'promptDraft';
const PROMPT_HISTORY_KEY = 'promptHistory';
const PROMPT_TEMPLATES_KEY = 'promptTemplates';

const getInitialHistory = (): HistoryItem[] => {
  try {
    const storedHistory = localStorage.getItem(PROMPT_HISTORY_KEY);
    return storedHistory ? JSON.parse(storedHistory) : [];
  } catch (e) {
    console.error("Failed to parse history from localStorage.", e);
    return [];
  }
};

const getInitialTemplates = (): PromptTemplate[] => {
  try {
    const storedTemplates = localStorage.getItem(PROMPT_TEMPLATES_KEY);
    return storedTemplates ? JSON.parse(storedTemplates) : [];
  } catch (e) {
    console.error("Failed to parse templates from localStorage.", e);
    return [];
  }
};

function App() {
  // State for UI controls
  const [originalPrompt, setOriginalPrompt] = useState<string>('');
  const [promptContext, setPromptContext] = useState<string>('');
  const [category, setCategory] = useState<string>(PROMPT_CATEGORIES[0]);
  const [isAutomatic, setIsAutomatic] = useState<boolean>(true);
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);

  // State for API interaction and results
  const [enhancedPrompts, setEnhancedPrompts] = useState<EnhancedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for modals, history, and templates
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState<boolean>(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>(getInitialHistory);
  const [templates, setTemplates] = useState<PromptTemplate[]>(getInitialTemplates);
  
  const draftDebounce = useRef<number | null>(null);
  const categoryDebounce = useRef<number | null>(null);
  const suppressSuggestion = useRef<boolean>(false);

  // Load draft from localStorage on initial mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(PROMPT_DRAFT_KEY);
      if (savedDraft) {
        const { prompt, category: savedCategory, promptContext: savedContext } = JSON.parse(savedDraft);
        if (prompt) setOriginalPrompt(prompt);
        if (savedCategory && PROMPT_CATEGORIES.includes(savedCategory)) setCategory(savedCategory);
        if (savedContext) setPromptContext(savedContext);
      }
    } catch (e) {
      console.error("Failed to load prompt draft from localStorage", e);
    }
  }, []);

  // Debounced auto-save for the current prompt draft
  useEffect(() => {
    if (draftDebounce.current) clearTimeout(draftDebounce.current);
    draftDebounce.current = window.setTimeout(() => {
      localStorage.setItem(PROMPT_DRAFT_KEY, JSON.stringify({ prompt: originalPrompt, category, promptContext }));
    }, 500);
    return () => { if (draftDebounce.current) clearTimeout(draftDebounce.current); };
  }, [originalPrompt, category, promptContext]);

  // Debounced automatic category suggestion
  useEffect(() => {
    const plainTextPrompt = stripHtml(originalPrompt).trim();
    if (categoryDebounce.current) clearTimeout(categoryDebounce.current);
    if (suppressSuggestion.current) {
        suppressSuggestion.current = false;
        return;
    }
    const wordCount = plainTextPrompt.split(/\s+/).filter(Boolean).length;
    if (!isAutomatic || wordCount < 3 || isLoading) {
      setIsSuggestingCategory(false);
      return;
    }
    let isCancelled = false;
    categoryDebounce.current = window.setTimeout(async () => {
      setIsSuggestingCategory(true);
      try {
        const suggested = await suggestCategory(plainTextPrompt);
        if (!isCancelled && suggested) setCategory(suggested);
      } catch (err) {
        console.error("Category suggestion failed:", err);
      } finally {
        if (!isCancelled) setIsSuggestingCategory(false);
      }
    }, 1000);
    return () => { isCancelled = true; if (categoryDebounce.current) clearTimeout(categoryDebounce.current); };
  }, [originalPrompt, isLoading, isAutomatic]);

  // Persist history and templates to localStorage
  useEffect(() => {
    localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(history));
  }, [history]);
  
  useEffect(() => {
    localStorage.setItem(PROMPT_TEMPLATES_KEY, JSON.stringify(templates));
  }, [templates]);

  const handlePromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const plainTextPrompt = stripHtml(originalPrompt);
    if (!plainTextPrompt.trim()) return setError('لطفاً پرامت اصلی را وارد کنید.');
    if (!isAutomatic && selectedTechniques.length === 0) return setError('در حالت دستی، حداقل یک تکنیک باید انتخاب شود.');
    setIsLoading(true);
    setError(null);
    setEnhancedPrompts([]);
    try {
      const techniquesToUse = isAutomatic ? await selectTechniques(plainTextPrompt, category, promptContext) : selectedTechniques;
      const results = await enhancePrompt(plainTextPrompt, category, techniquesToUse);
      
      // Streaming display of cards
      for (const result of results) {
          setEnhancedPrompts(prev => [...prev, result]);
          await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const newHistoryItem: HistoryItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        originalPrompt, category, outputs: results, timestamp: Date.now(),
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 100));
    } catch (err: any) {
      setError(err.message || 'یک خطای ناشناخته رخ داد.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    suppressSuggestion.current = true;
    setOriginalPrompt(item.originalPrompt);
    setCategory(item.category);
    setEnhancedPrompts(item.outputs);
    setPromptContext('');
    setError(null);
    setIsHistoryModalOpen(false);
    setIsAutomatic(true);
    setSelectedTechniques([]);
  };

  const handleClearHistory = () => {
    if (window.confirm('آیا از پاک کردن تمام تاریخچه مطمئن هستید؟')) setHistory([]);
  };

  const updateHistoryItem = (id: string, updateFn: (item: HistoryItem) => HistoryItem) => {
    setHistory(prev => prev.map(item => item.id === id ? updateFn(item) : item));
  };
  
  const handleToggleFavorite = (id: string) => updateHistoryItem(id, item => ({ ...item, isFavorite: !item.isFavorite }));
  const handleAddTag = (id: string, tag: string) => updateHistoryItem(id, item => ({ ...item, tags: [...new Set([...(item.tags || []), tag])] }));
  const handleRemoveTag = (id: string, tag: string) => updateHistoryItem(id, item => ({ ...item, tags: item.tags?.filter(t => t !== tag) || [] }));

  // Template Handlers
  const handleSaveTemplate = (name: string) => {
    const newTemplate: PromptTemplate = {
      id: `${Date.now()}`, name, originalPrompt, category, isAutomatic,
      techniques: selectedTechniques, promptContext,
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setIsSaveTemplateModalOpen(false);
  };

  const handleLoadTemplate = (template: PromptTemplate) => {
    suppressSuggestion.current = true;
    setOriginalPrompt(template.originalPrompt);
    setCategory(template.category);
    setIsAutomatic(template.isAutomatic);
    setSelectedTechniques(template.techniques);
    setPromptContext(template.promptContext);
    setEnhancedPrompts([]);
    setError(null);
    setIsTemplatesModalOpen(false);
  };
  
  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('آیا از حذف این الگو مطمئن هستید؟')) {
      setTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="bg-[#0D1117] min-h-screen text-[#E6EDF3] font-sans" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold mb-2 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#33D7FF] to-[#E040FB]">luntra</h1>
          <p className="text-[#8B949E]">پرامت‌های خود را با هوش مصنوعی به سطح بالاتری ببرید</p>
        </header>
        
        <div className="bg-[#161B22] border border-[#30363D] rounded-xl shadow-2xl max-w-4xl mx-auto">
          <form onSubmit={handlePromptSubmit} className="p-6 md:p-8 space-y-6">
            
            <div>
              <label className="block text-lg font-semibold mb-2 text-[#E6EDF3]">۱. پرامت اصلی خود را وارد کنید:</label>
              <RichTextInput value={originalPrompt} onChange={setOriginalPrompt} placeholder="مثال: خلاصه‌ای از کتاب «کیمیاگر» در ۲۰۰ کلمه بنویس..." />
            </div>

            {isAutomatic && (
                <div className="transition-opacity duration-300">
                    <label htmlFor="prompt-context" className="block text-lg font-semibold mb-2 text-[#E6EDF3]">۲. هدف پرامت را توضیح دهید (اختیاری):</label>
                    <textarea id="prompt-context" value={promptContext} onChange={(e) => setPromptContext(e.target.value)} placeholder="مثال: می‌خواهم خلاصه‌ای تولید شود که برای ارائه در کلاس مناسب باشد و نکات کلیدی داستان را برجسته کند." className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 focus:ring-2 focus:ring-[#33D7FF] focus:border-[#33D7FF] transition-all duration-200 min-h-[80px] resize-y" rows={3} />
                    <p className="text-xs text-[#8B949E] mt-1">توضیح بیشتر به هوش مصنوعی کمک می‌کند تا در حالت خودکار، بهترین تکنیک‌ها را برای شما انتخاب کند.</p>
                </div>
            )}

            <div>
              <label htmlFor="category-select" className="block text-lg font-semibold mb-2 text-[#E6EDF3]">
                <div className="flex items-center gap-2">
                    <span>{isAutomatic ? '۳' : '۲'}. دسته‌بندی پرامت را انتخاب کنید:</span>
                    {isSuggestingCategory && (<div className="flex items-center text-xs text-[#33D7FF]"><Spinner /><span className="mr-1">در حال تحلیل...</span></div>)}
                </div>
              </label>
              <select id="category-select" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 focus:ring-2 focus:ring-[#33D7FF] focus:border-[#33D7FF] transition-all duration-200">
                {PROMPT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-lg font-semibold mb-3 text-[#E6EDF3]">{isAutomatic ? '۴' : '۳'}. حالت انتخاب تکنیک‌ها را مشخص کنید:</label>
              <div className="flex justify-between items-center"><AutomaticModeToggle isAutomatic={isAutomatic} setIsAutomatic={setIsAutomatic} isDisabled={isLoading} /><button type="button" onClick={() => setIsGuideModalOpen(true)} className="text-sm text-[#33D7FF] hover:underline">راهنمای تکنیک</button></div>
            </div>
            
            {!isAutomatic && (<div><h4 className="font-semibold mb-3 text-md text-white">تکنیک‌های مورد نظر را انتخاب کنید:</h4><TechniqueSelector allTechniques={Object.keys(PROMPT_TECHNIQUES)} selectedTechniques={selectedTechniques} onChange={setSelectedTechniques} isDisabled={isLoading} /></div>)}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#30363D]">
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                <button type="submit" disabled={isLoading} className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-[#33D7FF] to-[#E040FB] hover:from-[#44E8FF] hover:to-[#F151FF] text-[#0D1117] font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#33D7FF]/10">{isLoading && <Spinner />}{isLoading ? 'در حال پردازش...' : 'ساخت پرامت‌های جدید'}</button>
                <button type="button" onClick={() => setIsSaveTemplateModalOpen(true)} disabled={!stripHtml(originalPrompt).trim()} className="w-full sm:w-auto text-center bg-transparent border border-[#30363D] hover:bg-[#30363D]/50 text-[#8B949E] font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">ذخیره الگو</button>
              </div>
              <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
                <button type="button" onClick={() => setIsTemplatesModalOpen(true)} className="w-full sm:w-auto text-center bg-transparent border border-[#30363D] hover:bg-[#30363D]/50 text-[#8B949E] font-semibold py-3 px-6 rounded-lg transition-all duration-200">الگوها</button>
                <button type="button" onClick={() => setIsHistoryModalOpen(true)} className="w-full sm:w-auto text-center bg-transparent border border-[#33D7FF] hover:bg-[#33D7FF]/10 text-[#33D7FF] font-semibold py-3 px-6 rounded-lg transition-all duration-200">تاریخچه</button>
              </div>
            </div>
          </form>
        </div>

        {error && (<ErrorDisplay errorMessage={error} onDismiss={() => setError(null)} />)}

        {enhancedPrompts.length > 0 && (
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#33D7FF] to-[#E040FB]">پرامت‌های بهبودیافته</h2>
            <div className="space-y-4">
              {enhancedPrompts.map((prompt, index) => (<PromptCard key={`${prompt.technique}-${index}`} enhancedPrompt={prompt} />))}
            </div>
          </div>
        )}
      </div>

      <GuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={history} onSelect={handleSelectHistory} onClear={handleClearHistory} onToggleFavorite={handleToggleFavorite} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
      <SaveTemplateModal isOpen={isSaveTemplateModalOpen} onClose={() => setIsSaveTemplateModalOpen(false)} onSave={handleSaveTemplate} />
      <TemplatesModal isOpen={isTemplatesModalOpen} onClose={() => setIsTemplatesModalOpen(false)} templates={templates} onLoad={handleLoadTemplate} onDelete={handleDeleteTemplate} />
    </div>
  );
}

export default App;