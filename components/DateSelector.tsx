
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Icons } from '../constants';
import { useApp } from '../AppContext';

interface DateSelectorProps {
  value?: number; // timestamp
  onSave: (value: number) => void;
  onCancel: () => void;
  className?: string;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ value, onSave, onCancel, className = "" }) => {
  const { state } = useApp();
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      setInputValue(`${y}/${m}/${d}`);
    }
  }, [value]);

  const parseDate = (str: string): number | null => {
    const s = str.trim().toLowerCase();
    if (!s) return null;

    // Support: YYYY/MM/DD, YY/MM/DD, YYYY.MM.DD, YY.MM.DD
    const numericMatch = s.match(/^(\d{2,4})[\/\.](\d{1,2})[\/\.](\d{1,2})$/);
    if (numericMatch) {
      let y = parseInt(numericMatch[1]);
      let m = parseInt(numericMatch[2]) - 1;
      let d = parseInt(numericMatch[3]);
      
      if (y < 100) y += 2000;
      const date = new Date(y, m, d);
      if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
        return date.getTime();
      }
    }

    // Support: YYYY MMM DD, YY MMM DD (e.g., 2026 jan 23, 26 jan 23)
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const alphaMatch = s.match(/^(\d{2,4})\s+([a-z]{3,})\s+(\d{1,2})$/);
    if (alphaMatch) {
      let y = parseInt(alphaMatch[1]);
      const mStr = alphaMatch[2].substring(0, 3);
      let d = parseInt(alphaMatch[3]);
      
      const m = monthNames.indexOf(mStr);
      if (m !== -1) {
        if (y < 100) y += 2000;
        const date = new Date(y, m, d);
        if (date.getFullYear() === y && date.getMonth() === m && date.getDate() === d) {
          return date.getTime();
        }
      }
    }

    // Fallback to native Date.parse
    const fallback = Date.parse(s);
    if (!isNaN(fallback)) return fallback;

    return null;
  };

  const handleConfirm = () => {
    const timestamp = parseDate(inputValue);
    if (timestamp) {
      onSave(timestamp);
    } else {
      alert("Invalid date format. Try YYYY/MM/DD or YYYY MMM DD");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={`flex items-center gap-2 w-full ${className}`}
    >
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="YYYY/MM/DD"
        autoFocus
        className="flex-1 h-9 bg-white/5 border border-white/10 rounded-full px-4 text-[11px] font-black tracking-widest text-white placeholder:text-white/20 outline-none focus:border-[var(--accent)] transition-all"
        style={{ '--accent': state.settings.buttonColor } as any}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleConfirm();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button
        onClick={handleConfirm}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0"
        style={{ backgroundColor: state.settings.buttonColor }}
      >
        <Icons.Check />
      </button>
      <button
        onClick={onCancel}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-red-500/20 text-red-500 border border-red-500/30 active:scale-90 transition-all shrink-0"
      >
        <Icons.X size={16} />
      </button>
    </motion.div>
  );
};

