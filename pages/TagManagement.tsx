
import React, { useMemo, memo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { SkeletonCircle } from '../components/SkeletonCard';

const TagCardAsList = memo(({ tag, onClick, borderColor, isLast }: { tag: any, onClick: () => void, borderColor: string, isLast: boolean }) => {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-4 px-2 py-4 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] cursor-pointer group ${!isLast ? 'border-b border-[var(--border)]' : ''}`}
    >
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center bg-neutral-900/50 border-[2px] shrink-0 text-yellow-500/80 overflow-hidden relative shadow-md transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        {tag.originalImageUrl || tag.imageUrl ? (
          <img 
            src={tag.originalImageUrl || tag.imageUrl} 
            className="w-full h-full object-cover" 
            alt={tag.name}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="scale-[1.2] opacity-80">
            <Icons.Hashtag />
          </div>
        )}
      </div>
      <span className="text-[var(--text-primary)] font-bold text-[17px] tracking-normal truncate flex-1 leading-relaxed">
        {tag.name}
      </span>
    </div>
  );
});

const TagListItem = memo(({ tag, onClick, borderColor }: { tag: any, onClick: () => void, borderColor: string }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex items-center gap-6 px-5 py-4.5 relative transition-all duration-200 active:bg-[var(--text-primary)]/[0.03] active:scale-[0.99] cursor-pointer group mb-3 last:mb-0 shadow-sm"
      style={{ minHeight: '112px' }}
    >
      <div 
        className="w-24 h-24 rounded-full flex items-center justify-center bg-neutral-900/50 border-[3.5px] shrink-0 text-yellow-500/80 overflow-hidden relative shadow-xl ring-1 ring-black/10 transition-colors duration-500"
        style={{ borderColor: borderColor }}
      >
        {tag.originalImageUrl || tag.imageUrl ? (
          <img 
            src={tag.originalImageUrl || tag.imageUrl} 
            className="w-full h-full object-cover" 
            alt={tag.name}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="scale-[1.8] opacity-70">
            <Icons.Hashtag />
          </div>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span className="text-[var(--text-primary)] font-bold text-[19px] tracking-normal truncate group-active:text-[var(--accent)] transition-colors leading-relaxed py-1.5">
          {tag.name}
        </span>
      </div>
    </div>
  );
});

export const TagManagement: React.FC = () => {
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

  const sortedTags = useMemo(() => {
    return [...state.tags].filter(t => !t.isDeleted).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [state.tags]);

  const filteredTags = useMemo(() => {
    if (!deferredSearchQuery.trim()) return sortedTags;
    return sortedTags.filter(tag => 
      tag.name.toLowerCase().includes(deferredSearchQuery.toLowerCase())
    );
  }, [sortedTags, deferredSearchQuery]);

  const handleTagClick = (id: string) => {
    navigate(`/tag/${id}`, { state: { from: location.pathname + location.search } });
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-2xl mx-auto px-2 pb-3.5 animate-slide-in pt-3.5">
      {managementView === 'Card' ? (
        <div className="flex flex-col" style={{ contentVisibility: 'auto' }}>
          {filteredTags.map((tag, index) => (
            <TagCardAsList 
              key={tag.id} 
              tag={tag} 
              onClick={() => handleTagClick(tag.id)}
              borderColor={circleBorderColor}
              isLast={index === filteredTags.length - 1}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col" style={{ contentVisibility: 'auto' }}>
          {filteredTags.map(tag => (
            <TagListItem 
              key={tag.id} 
              tag={tag} 
              onClick={() => handleTagClick(tag.id)}
              borderColor={circleBorderColor}
            />
          ))}
        </div>
      )}
      
      {filteredTags.length === 0 && (
        <div className="py-32 text-center w-full">
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.4em] text-[10px] opacity-20">
            {searchQuery ? 'No matching records found' : 'Registry Empty'}
          </div>
        </div>
      )}
    </div>
  );
};
