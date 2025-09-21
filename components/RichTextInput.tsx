
import React, { useRef, useEffect, useMemo } from 'react';

// Make TypeScript aware of the globally available hljs object from the script tag
declare var hljs: any;

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const ToolbarButton: React.FC<{ onClick: (e: React.MouseEvent) => void; children: React.ReactNode, title: string, disabled?: boolean }> = ({ onClick, children, title, disabled = false }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus
      className="p-2 rounded-md text-[#E6EDF3] hover:bg-[#33D7FF]/10 focus:outline-none focus:ring-2 focus:ring-[#33D7FF] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={title}
      disabled={disabled}
    >
      {children}
    </button>
  );


const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  
  const charCount = useMemo(() => {
    const div = document.createElement('div');
    div.innerHTML = value;
    return div.textContent?.length || 0;
  }, [value]);
  
  // Sync editor content with value prop, avoiding cursor jumps
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Apply syntax highlighting
  useEffect(() => {
    if (editorRef.current) {
        const codeBlocks = editorRef.current.querySelectorAll('pre');
        codeBlocks.forEach((block) => {
            try {
                hljs.highlightElement(block);
            } catch (e) {
                console.error("Error applying syntax highlighting:", e);
            }
        });
    }
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      if(editorRef.current && editorRef.current.contains(selection.anchorNode)){
          savedRange.current = selection.getRangeAt(0).cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (savedRange.current) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(savedRange.current);
      }
    } else if (editorRef.current) {
        editorRef.current.focus();
    }
  };

  const handleInput = () => {
    if(editorRef.current) onChange(editorRef.current.innerHTML);
    saveSelection();
  };
  
  const handleCommand = (command: string, valueArg?: string) => {
    if (editorRef.current) {
        editorRef.current.focus();
        restoreSelection();
        document.execCommand(command, false, valueArg);
        onChange(editorRef.current.innerHTML);
        saveSelection();
    }
  };

  const findParentTag = (node: Node | null, tagName: string): HTMLElement | null => {
    let el = node instanceof Element ? node : node?.parentElement;
    while (el) {
        if (el.tagName === tagName) {
            return el as HTMLElement;
        }
        // Stop search at the editor boundary
        if (el === editorRef.current) {
            return null;
        }
        el = el.parentElement;
    }
    return null;
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const node = selection.getRangeAt(0).commonAncestorContainer;

      // Handle indentation for lists
      if (findParentTag(node, 'LI')) {
        e.preventDefault();
        document.execCommand(e.shiftKey ? 'outdent' : 'indent');
        handleInput(); // Manually trigger update to save changes
        return;
      }

      // Handle tabs in code blocks
      if (findParentTag(node, 'PRE')) {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        handleInput(); // Manually trigger update to save changes
        return;
      }
    }
  };

  return (
    <div className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg focus-within:ring-2 focus-within:ring-[#33D7FF] focus-within:border-[#33D7FF] focus-within:shadow-[0_0_15px_rgba(51,215,255,0.2)] transition-all duration-300 shadow-inner">
      <div className="flex items-center p-1 border-b border-[#30363D] space-x-1 rtl:space-x-reverse flex-wrap">
        <ToolbarButton onClick={() => handleCommand('bold')} title="Bold">
          <strong className="text-lg w-5 h-5 flex items-center justify-center">B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => handleCommand('italic')} title="Italic">
          <em className="font-serif text-lg w-5 h-5 flex items-center justify-center">I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => handleCommand('formatBlock', 'pre')} title="Code Block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => handleCommand('insertUnorderedList')} title="Bulleted List">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM3.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM3.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
        </ToolbarButton>
        <ToolbarButton onClick={() => handleCommand('insertOrderedList')} title="Numbered List">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6h11M9 12h11M9 18h11" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 6l-1-1v2.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h2l-2 2h2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h2a1 1 0 001-1v-1a1 1 0 00-1-1H4a1 1 0 00-1 1v1a1 1 0 001 1z" />
            </svg>
        </ToolbarButton>
        <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleCommand('fontSize', e.target.value);
                  e.target.value = ""; // Reset to placeholder
                }
              }}
              title="اندازه فونت"
              aria-label="اندازه فونت"
              className="bg-transparent py-2 pl-3 pr-8 rounded-md text-[#E6EDF3] hover:bg-[#33D7FF]/10 focus:outline-none focus:ring-2 focus:ring-[#33D7FF] transition-all duration-200 appearance-none text-sm cursor-pointer"
            >
              <option value="" disabled>اندازه فونت</option>
              <option value="2">کوچک</option>
              <option value="3">معمولی</option>
              <option value="6">بزرگ</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#8B949E]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable={true}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onFocus={saveSelection}
        className="w-full p-3 min-h-[110px] outline-none resize-y overflow-auto"
        data-placeholder={placeholder}
        aria-label="Prompt Input Area"
        role="textbox"
      ></div>

       <div className="text-right text-xs text-[#8B949E] px-3 py-1 border-t border-[#30363D]">
        <span>{charCount} کاراکتر</span>
      </div>
    </div>
  );
};

export default RichTextInput;
