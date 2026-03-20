import React, { useState, useRef } from 'react';
import { Icons } from '../constants';

export const InputBar = React.memo<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  onPasteCapture?: (text: string) => void;
  placeholder: string;
  showPaste?: boolean;
  rightElement?: React.ReactNode;
  isLoading?: boolean;
  isDuplicate?: boolean;
  isTextArea?: boolean;
}>(({ label, value, onChange, onPasteCapture, placeholder, showPaste, rightElement, isLoading, isDuplicate, isTextArea = false }) => {
  const id = React.useId();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleManualPaste = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onChange(text);
          inputRef.current?.focus();
          if (onPasteCapture) onPasteCapture(text);
        }
      }
    } catch (err) {
      console.error('Clipboard access failed', err);
    }
  };

  return (
    <div className={`group flex flex-col w-full transition-all duration-200 relative pointer-events-auto bg-[var(--surface)] rounded-full border ${isFocused ? 'border-[var(--accent)]' : 'border-transparent'}`}>
      <div className="flex items-center w-full min-h-[48px] px-6 gap-3">
        {showPaste && (
          <button 
            type="button" 
            onClick={handleManualPaste} 
            className="w-10 h-10 -ml-2 flex items-center justify-center text-[var(--text-primary)] shrink-0 active:scale-75 transition-transform tap-highlight-none"
          >
            <Icons.Paste />
          </button>
        )}
        <div className="flex-1 flex flex-col py-1.5">
          <label htmlFor={id} className={`text-[9px] font-black uppercase tracking-[0.25em] transition-colors duration-300 ${isFocused ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>{label}</label>
          {isTextArea ? (
            <textarea
              id={id}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none font-medium tracking-tight h-5 select-text resize-none overflow-hidden"
              rows={1}
              style={{ height: value.includes('\n') ? 'auto' : '20px', minHeight: '20px' }}
            />
          ) : (
            <input 
              id={id}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-[14px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none font-medium tracking-tight h-5 select-text"
            />
          )}
        </div>
        {isLoading && <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />}
        {isDuplicate && (
          <div className="w-8 h-8 flex items-center justify-center text-rose-500 animate-pulse" title="Duplicate value detected">
            <Icons.AlertTriangle />
          </div>
        )}
        {rightElement && <div className="flex items-center justify-center shrink-0">{rightElement}</div>}
      </div>
    </div>
  );
});
