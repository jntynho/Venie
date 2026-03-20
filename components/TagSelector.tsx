import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { InputBar } from './InputBar';

interface TagSelectorProps {
  tagSearch: string;
  setTagSearch: (search: string) => void;
  selectedTagIds: string[];
  setSelectedTagIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentPath: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  tagSearch,
  setTagSearch,
  selectedTagIds,
  setSelectedTagIds,
  currentPath,
}) => {
  const navigate = useNavigate();
  const { state, tagUsageMap } = useApp();
  const [debouncedTagSearch, setDebouncedTagSearch] = useState(tagSearch);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTagSearch(tagSearch), 300);
    return () => clearTimeout(handler);
  }, [tagSearch]);

  const filteredTags = useMemo(() => {
    const isSearching = debouncedTagSearch.trim().length > 0;
    let pool = state.tags.filter(t => !t.isDeleted);

    if (isSearching) {
      pool = pool.filter(t => t.name.toLowerCase().includes(debouncedTagSearch.toLowerCase()));
    }

    const sorted = pool.sort((a, b) => {
      const aSel = selectedTagIds.includes(a.id) ? 1 : 0;
      const bSel = selectedTagIds.includes(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;

      const aUse = tagUsageMap[a.id] || 0;
      const bUse = tagUsageMap[b.id] || 0;
      return bUse - aUse;
    });

    return isSearching ? sorted.slice(0, 15) : sorted.slice(0, 10);
  }, [state.tags, tagSearch, selectedTagIds, tagUsageMap]);

  return (
    <div className="flex flex-col">
      <InputBar 
        label="Tags" 
        value={tagSearch} 
        onChange={setTagSearch} 
        placeholder="Filter tags..." 
        rightElement={
          <button onClick={() => navigate('/manage-tags/add?from=add', { state: { from: currentPath } })} className="w-10 h-10 flex items-center justify-center text-[var(--accent)] active:scale-75 transition-transform"><Icons.Plus /></button>
        }
      />
      <div className="flex flex-wrap gap-4 mt-5 px-1 min-h-[40px]">
        {filteredTags.map(t => (
          <button 
            key={t.id} 
            onClick={() => {
              if (selectedTagIds.includes(t.id)) {
                setSelectedTagIds([]);
              } else {
                setSelectedTagIds([t.id]);
              }
            }} 
            className={`text-[12px] font-black uppercase tracking-widest transition-all ${selectedTagIds.includes(t.id) ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
          >
            {t.name}
          </button>
        ))}
        {!tagSearch && state.tags.filter(t => !t.isDeleted).length > filteredTags.length && (
          <div className="text-[24px] font-black text-[var(--text-muted)] leading-none mt-1 self-center opacity-40 select-none">…</div>
        )}
      </div>
    </div>
  );
};
