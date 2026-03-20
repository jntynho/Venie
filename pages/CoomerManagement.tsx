
import React, { useMemo, memo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { SkeletonCircle } from '../components/SkeletonCard';
import { toTitleCase } from '../utils/format';

const CoomerGridItem = memo(({ coomer, onClick, borderColor }: { coomer: any, onClick: () => void, borderColor: string }) => {
  const imgSrc = coomer.originalImageUrl || coomer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(coomer.name)}&background=random`;
  
  return (
    <div 
      onClick={onClick}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] flex flex-col items-center justify-center py-6 px-3 min-h-[140px] relative transition-all duration-300 active:scale-95 cursor-pointer shadow-sm"
    >
      <div 
        className="w-[88%] aspect-square rounded-full overflow-hidden bg-neutral-900 border-[3px] shrink-0 shadow-lg relative transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        <img 
          src={imgSrc} 
          className="w-full h-full object-cover" 
          alt={coomer.name}
          referrerPolicy="no-referrer"
        />
      </div>
      
      <span className="text-[var(--text-primary)] font-bold text-[13px] tracking-normal text-center truncate w-full px-2 mt-4 leading-relaxed">
        {toTitleCase(coomer.name)}
      </span>
    </div>
  );
});

const CoomerListItem = memo(({ coomer, onClick, borderColor }: { coomer: any, onClick: () => void, borderColor: string }) => {
  const imgSrc = coomer.originalImageUrl || coomer.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(coomer.name)}&background=random`;

  return (
    <div 
      onClick={onClick}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center gap-6 px-5 py-4.5 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] active:scale-[0.99] cursor-pointer group mb-3 last:mb-0 shadow-sm"
      style={{ minHeight: '112px' }}
    >
      <div 
        className="w-24 h-24 rounded-full overflow-hidden bg-neutral-900 border-[3.5px] shrink-0 shadow-xl relative ring-1 ring-black/10 transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        <img 
          src={imgSrc} 
          className="w-full h-full object-cover" 
          alt={coomer.name}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span className="text-[var(--text-primary)] font-bold text-[19px] tracking-normal truncate group-active:text-[var(--accent)] transition-colors leading-relaxed py-1.5">
          {toTitleCase(coomer.name)}
        </span>
      </div>
    </div>
  );
});

export const CoomerManagement: React.FC = () => {
  const { state, searchQuery, isHydrated } = useApp();
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const { managementView, sortOrder, circleBorderColor } = state.settings;

  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    });
  }, [location.pathname]);
  
  const filteredCoomers = useMemo(() => {
    let coomers = state.coomers.filter(c => !c.isDeleted);
    
    if (deferredSearchQuery.trim()) {
      coomers = coomers.filter(coomer => 
        coomer.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    return coomers.sort((a, b) => {
      if (sortOrder === 'Newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOrder === 'A-Z') return a.name.localeCompare(b.name);
      if (sortOrder === 'Z-A') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [state.coomers, searchQuery, sortOrder]);

  const handleCoomerClick = (id: string) => {
    navigate(`/coomer/${id}`, { state: { from: location.pathname + location.search } });
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-2xl mx-auto px-2 pb-3.5 animate-slide-in pt-3.5">
      {managementView === 'Card' ? (
        <div className="grid grid-cols-2 gap-3">
          {filteredCoomers.map(coomer => (
            <CoomerGridItem 
              key={coomer.id} 
              coomer={coomer} 
              onClick={() => handleCoomerClick(coomer.id)}
              borderColor={circleBorderColor}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {filteredCoomers.map(coomer => (
            <CoomerListItem 
              key={coomer.id} 
              coomer={coomer} 
              onClick={() => handleCoomerClick(coomer.id)}
              borderColor={circleBorderColor}
            />
          ))}
        </div>
      )}
      
      {filteredCoomers.length === 0 && (
        <div className="py-32 text-center w-full">
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.4em] text-[10px] opacity-20">
            {searchQuery ? 'No matching records found' : 'Registry Empty'}
          </div>
        </div>
      )}
    </div>
  );
};
