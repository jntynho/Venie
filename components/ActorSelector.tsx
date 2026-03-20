import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { InputBar } from './InputBar';

interface ActorSelectorProps {
  actorSearch: string;
  setActorSearch: (search: string) => void;
  selectedActorIds: string[];
  setSelectedActorIds: React.Dispatch<React.SetStateAction<string[]>>;
  currentPath: string;
}

export const ActorSelector: React.FC<ActorSelectorProps> = ({
  actorSearch,
  setActorSearch,
  selectedActorIds,
  setSelectedActorIds,
  currentPath,
}) => {
  const navigate = useNavigate();
  const { state, actorUsageMap, actorTagAffinityMap } = useApp();
  const [debouncedActorSearch, setDebouncedActorSearch] = useState(actorSearch);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedActorSearch(actorSearch), 300);
    return () => clearTimeout(handler);
  }, [actorSearch]);

  const filteredActors = useMemo(() => {
    const isSearching = debouncedActorSearch.trim().length > 0;
    let pool = state.actors.filter(a => !a.isDeleted);
    
    if (isSearching) {
      pool = pool.filter(a => a.name.toLowerCase().includes(debouncedActorSearch.toLowerCase()));
    }

    const missavTag = state.tags.find(t => t.name.toUpperCase() === 'MISSAV' && !t.isDeleted);
    // Note: We need to know if Missav is active. Since this is now a separate component, 
    // we might need to pass this info as a prop or get it from context if available.
    // For now, let's simplify or pass it as a prop if needed.
    // Assuming context is enough for now or we can pass selectedTagIds if needed.
    
    const sorted = pool.sort((a, b) => {
      const aSel = selectedActorIds.includes(a.id) ? 1 : 0;
      const bSel = selectedActorIds.includes(b.id) ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      
      const aUse = actorUsageMap[a.id] || 0;
      const bUse = actorUsageMap[b.id] || 0;
      return bUse - aUse;
    });

    return isSearching ? sorted.slice(0, 15) : sorted.slice(0, 10);
  }, [state.actors, state.tags, actorSearch, selectedActorIds, actorUsageMap, actorTagAffinityMap]);

  return (
    <div className="flex flex-col mb-10">
      <InputBar 
        label="Actors" 
        value={actorSearch} 
        onChange={setActorSearch} 
        placeholder="Filter actors..." 
        rightElement={
          <button onClick={() => navigate('/manage-actors/add?from=add', { state: { from: currentPath } })} className="w-10 h-10 flex items-center justify-center text-[var(--accent)] active:scale-75 transition-transform"><Icons.Plus /></button>
        }
      />
      <div className="flex flex-wrap gap-4 mt-5 px-1 min-h-[40px]">
        {filteredActors.map(a => (
          <button 
            key={a.id} 
            onClick={() => setSelectedActorIds(prev => prev.includes(a.id) ? prev.filter(i => i !== a.id) : [...prev, a.id])} 
            className={`text-[12px] font-black uppercase tracking-widest transition-all ${selectedActorIds.includes(a.id) ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
          >
            {a.name}
          </button>
        ))}
        {!actorSearch && state.actors.filter(a => !a.isDeleted).length > filteredActors.length && (
          <div className="text-[24px] font-black text-[var(--text-muted)] leading-none mt-1 self-center opacity-40 select-none">…</div>
        )}
      </div>
    </div>
  );
};
