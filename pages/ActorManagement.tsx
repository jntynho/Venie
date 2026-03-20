
import React, { useMemo, memo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { SkeletonCircle } from '../components/SkeletonCard';
import { toTitleCase } from '../utils/format';

const ActorCardAsList = memo(({ actor, onClick, borderColor, isLast }: { actor: any, onClick: () => void, borderColor: string, isLast: boolean }) => {
  const imgSrc = actor.originalImageUrl || actor.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=random`;

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 px-2 py-4 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] cursor-pointer group ${!isLast ? 'border-b border-[var(--border)]' : ''}`}
    >
      <div 
        className="w-16 h-16 rounded-full overflow-hidden bg-neutral-900 border-[2px] shrink-0 shadow-md relative transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        <img 
          src={imgSrc} 
          className="w-full h-full object-cover" 
          alt={actor.name}
          referrerPolicy="no-referrer"
        />
      </div>
      <span className="text-[var(--text-primary)] font-bold text-[17px] tracking-normal truncate flex-1 leading-relaxed">
        {toTitleCase(actor.name)}
      </span>
    </div>
  );
});

const ActorListItem = memo(({ actor, onClick, borderColor }: { actor: any, onClick: () => void, borderColor: string }) => {
  const imgSrc = actor.originalImageUrl || actor.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}&background=random`;

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
          alt={actor.name}
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span className="text-[var(--text-primary)] font-bold text-[19px] tracking-normal truncate group-active:text-[var(--accent)] transition-colors leading-relaxed py-1.5">
          {toTitleCase(actor.name)}
        </span>
      </div>
    </div>
  );
});

export const ActorManagement: React.FC = () => {
  const { state, searchQuery, isHydrated } = useApp();
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const { managementView, circleBorderColor } = state.settings;

  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    });
  }, [location.pathname]);
  
  const sortedActors = useMemo(() => {
    return [...state.actors].filter(a => !a.isDeleted).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [state.actors]);

  const filteredActors = useMemo(() => {
    if (!deferredSearchQuery.trim()) return sortedActors;
    return sortedActors.filter(actor => 
      actor.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
    );
  }, [sortedActors, deferredSearchQuery]);

  const handleActorClick = (id: string) => {
    navigate(`/actor/${id}`, { state: { from: location.pathname + location.search } });
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-2xl mx-auto px-2 pb-3.5 animate-slide-in pt-3.5">
      {managementView === 'Card' ? (
        <div className="flex flex-col">
          {filteredActors.map((actor, index) => (
            <ActorCardAsList 
              key={actor.id} 
              actor={actor} 
              onClick={() => handleActorClick(actor.id)}
              borderColor={circleBorderColor}
              isLast={index === filteredActors.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {filteredActors.map(actor => (
            <ActorListItem 
              key={actor.id} 
              actor={actor} 
              onClick={() => handleActorClick(actor.id)}
              borderColor={circleBorderColor}
            />
          ))}
        </div>
      )}
      
      {filteredActors.length === 0 && (
        <div className="py-32 text-center w-full">
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.4em] text-[10px] opacity-20">
            {searchQuery ? 'No matching records found' : 'Registry Empty'}
          </div>
        </div>
      )}
    </div>
  );
};
