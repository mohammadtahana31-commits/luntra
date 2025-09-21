import React, { useState } from 'react';
import { EnhancedPrompt } from '../types';
import { executePromptStream } from '../services/geminiService';
import Spinner from './Spinner';

interface PromptCardProps {
  enhancedPrompt: EnhancedPrompt;
}

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 flex-shrink-0 mt-0.5 text-[#8B949E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);


const PromptCard: React.FC<PromptCardProps> = ({ enhancedPrompt }) => {
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string>('');
  const [executionError, setExecutionError] = useState<string | null>(null);

  const handleCopy = () => {
    if (enhancedPrompt.prompt) {
        navigator.clipboard.writeText(enhancedPrompt.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRunPrompt = async () => {
    setIsExecuting(true);
    setExecutionResult('');
    setExecutionError(null);

    try {
        await executePromptStream(
            enhancedPrompt.prompt,
            (chunk) => setExecutionResult(prev => prev + chunk),
            (error) => {
                setExecutionError(error.message || 'خطای ناشناخته در هنگام اجرا رخ داد.');
                setIsExecuting(false);
            }
        );
    } finally {
        setIsExecuting(false);
    }
  };

  return (
    <div className="bg-[#161B22]/80 backdrop-blur-sm border border-[#30363D] rounded-lg p-4 my-2 relative transition-all duration-300 hover:border-[#33D7FF] hover:shadow-[0_0_15px_rgba(51,215,255,0.2)] animate-fade-in">
       <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
         <h3 className="text-lg font-semibold text-[#33D7FF]">{enhancedPrompt.technique}</h3>
         <div className="flex items-center gap-2">
            <button
                onClick={handleRunPrompt}
                disabled={isExecuting}
                className="bg-[#33D7FF]/10 hover:bg-[#33D7FF]/20 text-[#33D7FF] font-bold py-1 px-3 rounded text-xs transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExecuting ? <Spinner /> : <PlayIcon />}
                <span>{isExecuting ? 'در حال اجرا...' : 'اجرا کن'}</span>
            </button>
            <button
                onClick={handleCopy}
                className="bg-[#30363D] hover:bg-[#33D7FF] text-[#E6EDF3] hover:text-[#0D1117] font-bold py-1 px-3 rounded text-xs transition-all duration-200"
                >
                {copied ? 'کپی شد!' : 'کپی'}
            </button>
         </div>
       </div>
      <div className="bg-[#0D1117] p-4 rounded-md">
        <p className="text-[#E6EDF3] whitespace-pre-wrap font-mono text-sm leading-relaxed">{enhancedPrompt.prompt}</p>
      </div>
      {enhancedPrompt.explanation && (
        <div className="mt-3 pt-3 border-t border-[#30363D] flex items-start text-[#8B949E]">
            <InfoIcon />
            <p className="text-xs italic leading-relaxed">{enhancedPrompt.explanation}</p>
        </div>
      )}
      {(isExecuting || executionResult || executionError) && (
        <div className="mt-4 pt-4 border-t border-[#30363D]">
            <h4 className="text-md font-semibold text-[#E6EDF3] mb-2">نتیجه اجرا:</h4>
            {executionError && (
                <div className="p-3 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg text-sm">
                    {executionError}
                </div>
            )}
            {executionResult && (
                 <div className="bg-black/20 p-4 rounded-md text-[#E6EDF3] whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {executionResult}
                 </div>
            )}
            {isExecuting && !executionResult && (
                <div className="flex items-center justify-center p-4 text-[#8B949E]">
                    <Spinner />
                    <span className="mr-2">در حال دریافت پاسخ...</span>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PromptCard;