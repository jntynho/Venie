
import React, { useState, memo, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../AppContext';
import { JapanLinkItem, DisplaySize } from '../types';
import { Icons } from '../constants';
import { useNavigate, useLocation } from 'react-router-dom';
import { SkeletonCard } from '../components/SkeletonCard';

const getTitleFontSize = (size: DisplaySize) => {
  switch (size) {
    case 'Small': return '0.85rem';
    case 'Large': return '1.1rem';
    default: return '1rem';
  }
};

const JapanLinkCard = memo(({ 
  link, 
  isExpanded, 
  onToggle 
}: { 
  link: JapanLinkItem; 
  isExpanded: boolean; 
  onToggle: () => void 
}) => {
  const { state, deleteJapanLink } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [inlineIndex, setInlineIndex] = useState(0);
  const [loadedGalleryImages, setLoadedGalleryImages] = useState<Record<number, boolean>>({});
  const { accentColor, galleryBgColor, showActorCheckmark } = state.settings;
  const longPressTimer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const actors = state.actors.filter(a => link.actorIds.includes(a.id) && !a.isDeleted);
  const springBezier = "cubic-bezier(0.3, 1.4, 0.6, 1)";

  useEffect(() => {
    if (!isExpanded) {
      const timer = setTimeout(() => setIsConfirming(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  const handleLongPress = useCallback(() => {
    if (link.galleryUrls && link.galleryUrls.length > 0) {
      if (navigator.vibrate) navigator.vibrate(50);
      setIsGalleryOpen(true);
      setInlineIndex(0);
    }
  }, [link.galleryUrls]);

  const startLongPress = useCallback(() => {
    if (link.galleryUrls && link.galleryUrls.length > 0) {
      longPressTimer.current = window.setTimeout(handleLongPress, 500);
    }
  }, [link.galleryUrls, handleLongPress]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleInlineScroll = () => {
    if (scrollRef.current) {
      const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
      if (idx !== inlineIndex) setInlineIndex(idx);
    }
  };

  const handleGalleryImageLoad = (idx: number) => {
    setLoadedGalleryImages(prev => ({ ...prev, [idx]: true }));
  };

  const actions = [];
  if (link.urlHD) {
    actions.push({ id: 'hd', icon: <Icons.HD />, action: () => window.open(link.urlHD, '_blank') });
  }
  if (link.url4K) {
    actions.push({ id: '4k', icon: <Icons.FourK />, action: () => window.open(link.url4K, '_blank') });
  }
  actions.push({ id: 'edit', icon: <Icons.Edit />, action: () => navigate(`/manage-japan/edit/${link.id}`) });
  actions.push({ id: 'trash', icon: <Icons.Trash />, action: () => setIsConfirming(true) });

  const navigateWithContext = useCallback((path: string) => {
    navigate(path, { state: { from: location.pathname + location.search } });
  }, [navigate, location]);

  return (
    <div className="flex flex-col w-full border-b border-[var(--border)] overflow-hidden group last:border-b-0" style={{ backgroundColor: 'var(--bg)' }}>
      <div 
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onClick={onToggle}
        className="relative w-full cursor-pointer overflow-hidden bg-[var(--surface)] aspect-[3/2]"
      >
        {!imgLoaded && !isGalleryOpen && (
          <div className="absolute inset-0 bg-white/[0.03] overflow-hidden">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        )}
        
        {!isGalleryOpen ? (
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out animate-slide-in"
            style={{ 
              backgroundImage: `url(${link.coverImage})`,
              transform: isExpanded ? 'scale(1.05)' : 'scale(1)',
              opacity: imgLoaded ? 1 : 0
            }}
          />
        ) : (
          <div className="absolute inset-0 animate-slide-in flex flex-col backdrop-blur-3xl" style={{ backgroundColor: galleryBgColor }}>
            <div 
              ref={scrollRef}
              onScroll={handleInlineScroll}
              className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gpu-accelerated"
            >
              {(link.galleryUrls || []).map((url, i) => (
                <div 
                  key={i} 
                  className="w-full h-full shrink-0 snap-center relative flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/preview/${link.id}?index=${i}&type=japan`);
                  }}
                >
                  {!loadedGalleryImages[i] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/[0.03] animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
                    </div>
                  )}
                  {url && (
                    <img 
                      src={url} 
                      onLoad={() => handleGalleryImageLoad(i)}
                      className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${loadedGalleryImages[i] ? 'opacity-100' : 'opacity-0'}`}
                      alt="" 
                    />
                  )}
                </div>
              ))}
            </div>
            
            <div className="absolute top-4 left-5 z-[30] pointer-events-none">
              <span className="text-[12px] font-black text-white/70 tracking-[0.12em] select-none pointer-events-auto leading-none">
                {inlineIndex + 1}/{link.galleryUrls?.length}
              </span>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setIsGalleryOpen(false); }}
              className="absolute top-4 right-5 z-[30] w-10 h-10 rounded-full bg-black/40 backdrop-blur-[32px] border border-white/15 flex items-center justify-center text-white active:scale-90 transition-all pointer-events-auto shadow-md"
            >
              <Icons.X />
            </button>
          </div>
        )}
        
        {link.coverImage && <img src={link.coverImage} className="hidden" onLoad={() => setImgLoaded(true)} loading="lazy" alt="" />}
        
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300" style={{ opacity: isExpanded ? 1 : 0 }} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 transition-all duration-300 z-10" style={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? 'auto' : 'none' }}>
          {isConfirming ? (
            <div className="flex flex-col items-center gap-8 animate-slide-in">
              <div className="flex items-center gap-8">
                <button 
                  onClick={(e) => handleAction(e, () => setIsConfirming(false))}
                  className="w-16 h-16 text-white/60 rounded-full flex items-center justify-center shrink-0 active:scale-90 shadow-xl overflow-hidden relative"
                  style={{
                    backgroundColor: 'rgba(30, 30, 30, 0.45)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div className="absolute inset-0 -z-10" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} />
                  <Icons.X />
                </button>
                <button 
                  onClick={(e) => handleAction(e, () => deleteJapanLink(link.id))}
                  className="w-16 h-16 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 shadow-2xl overflow-hidden relative"
                  style={{
                    backgroundColor: '#ef4444a0',
                    border: '2px solid #ef4444',
                  }}
                >
                  <div className="absolute inset-0 -z-10" style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }} />
                  <div className="scale-125"><Icons.Trash /></div>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              {actions.map((btn, idx) => (
                <button 
                  key={btn.id}
                  onClick={(e) => handleAction(e, btn.action)}
                  className="w-14 h-14 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 shadow-xl overflow-hidden relative"
                  style={{
                    backgroundColor: 'rgba(30, 30, 30, 0.45)',
                    transform: isExpanded ? 'translate3d(0,0,0) scale(1.1)' : 'translate3d(0,0,0) scale(0.6)',
                    opacity: isExpanded ? 1 : 0,
                    willChange: 'transform, opacity',
                    contain: 'paint',
                    border: `1.5px solid ${accentColor}40`,
                    transition: `transform 400ms ${springBezier}, opacity 250ms ease-out`,
                    transitionDelay: isExpanded ? `${idx * 40}ms` : '0ms',
                  }}
                >
                  <div className="absolute inset-0 -z-10" style={{ backdropFilter: 'blur(10px) saturate(160%)', WebkitBackdropFilter: 'blur(10px) saturate(160%)' }} />
                  <div className="scale-110 opacity-95 pointer-events-none relative z-10">
                    {btn.icon}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!isGalleryOpen && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-md rounded-md text-[9px] font-black text-white/90 uppercase tracking-widest border border-white/10">
            {link.code}
          </div>
        )}
      </div>

      <div className="px-4 py-4 flex flex-col gap-1.5" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex items-center gap-2">
           <span 
            onClick={(e) => {
              if (actors[0]) handleAction(e, () => navigateWithContext(`/actor/${actors[0].id}?context=jav`));
            }}
            className="text-sky-400 font-black text-[10px] uppercase tracking-[0.15em] truncate cursor-pointer active:opacity-60 transition-opacity"
          >
            {actors.map(a => a.name).join(' • ') || 'No Actor Label'}
          </span>
          {actors.length > 0 && showActorCheckmark && <Icons.Verified />}
        </div>
        <h3 className="text-[var(--text-primary)] font-bold leading-tight truncate tracking-tight" style={{ fontSize: getTitleFontSize(state.settings.titleSize) }}>
          {link.title}
        </h3>
      </div>
    </div>
  );
});

export const JapanLinks: React.FC<{ filteredLinksOverride?: JapanLinkItem[] }> = ({ filteredLinksOverride }) => {
  const { state, searchQuery, isHydrated } = useApp();
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const location = useLocation();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    });
  }, [location.pathname]);

  const filtered = useMemo(() => {
    if (filteredLinksOverride) return filteredLinksOverride;
    return state.japanLinks
      .filter(l => !l.isDeleted)
      .filter(l => 
        l.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) || 
        l.code.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
  }, [state.japanLinks, deferredSearchQuery, filteredLinksOverride]);

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col w-full min-h-full animate-slide-in" style={{ backgroundColor: 'var(--bg)' }}>
      {filtered.length === 0 ? (
        <div className="py-48 text-center px-6">
          <h2 className="text-sm font-black text-white/10 uppercase tracking-[0.4em]">Registry Standby</h2>
          <p className="text-[10px] text-white/5 mt-2 uppercase tracking-[0.2em]">No JAV records match your query</p>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          {filtered.map(link => (
            <JapanLinkCard 
              key={link.id} 
              link={link} 
              isExpanded={activeId === link.id} 
              onToggle={() => setActiveId(activeId === link.id ? null : link.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
};
