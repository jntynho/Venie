import React, { useMemo, memo, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { toTitleCase } from '../utils/format';
import { Icons } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { PaginationBar } from '../components/Pagination';

const HanimeCoverSlider = memo(({ hanime }: { hanime: any }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  
  const allCovers = useMemo(() => {
    const covers = [hanime.coverImage];
    if (hanime.secondaryCovers && hanime.secondaryCovers.length > 0) {
      covers.push(...hanime.secondaryCovers);
    }
    return covers.filter(Boolean);
  }, [hanime.coverImage, hanime.secondaryCovers]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const width = scrollContainerRef.current.clientWidth;
    if (width > 0) {
      const newIndex = Math.round(scrollLeft / width);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-neutral-900">
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex w-full h-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allCovers.map((cover, i) => (
          <div key={i} className="w-full h-full shrink-0 snap-center relative">
            {!loadedImages[i] && (
              <div className="absolute inset-0 bg-white/[0.03] overflow-hidden z-0">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-[shimmer_1.5s_infinite]" />
              </div>
            )}
            <img
              src={cover}
              className={`w-full h-full object-cover transition-opacity duration-500 ${loadedImages[i] ? 'opacity-100' : 'opacity-0'}`}
              alt={`${hanime.title} cover ${i + 1}`}
              referrerPolicy="no-referrer"
              draggable="false"
              loading={i === 0 ? "eager" : "lazy"}
              onLoad={() => handleImageLoad(i)}
            />
          </div>
        ))}
      </div>
      
      {allCovers.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 pointer-events-none drop-shadow-md">
          {allCovers.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const HanimeGridItem = memo(({ hanime, onClick, onDelete }: { hanime: any, onClick: () => void, onDelete: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const isLongPressActive = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useApp();
  const { buttonStyle } = state.settings;

  const easeOutExpo = "cubic-bezier(0.19, 1, 0.22, 1)";

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    setIsPressing(true);
    isLongPressActive.current = false;
    
    if (pressTimer.current) clearTimeout(pressTimer.current);
    
    pressTimer.current = window.setTimeout(() => {
      isLongPressActive.current = true;
      setIsExpanded(true);
      setIsPressing(false);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
      pressTimer.current = null;
    }, 500);
  };

  const handlePointerUp = () => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handlePointerCancel = () => {
    setIsPressing(false);
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (isLongPressActive.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressActive.current = false;
      return;
    }
    if (isExpanded) {
      if (!isConfirming) setIsExpanded(false);
      return;
    }
    onClick();
  };

  const getBtnStyle = (btnId: string, size: string = 'w-12 h-12') => {
    const semanticColors: Record<string, { bg: string, border: string, glow: string }> = {
      trash: { bg: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)', border: 'rgba(255,255,255,0.4)', glow: 'rgba(239, 68, 68, 0.5)' },
      cancel: { bg: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', border: 'rgba(255,255,255,0.3)', glow: 'rgba(0,0,0,0.3)' },
      edit: { bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', border: 'rgba(255,255,255,0.4)', glow: 'rgba(34, 197, 94, 0.5)' },
    };
    const sc = semanticColors[btnId] || { bg: 'linear-gradient(135deg, #333 0%, #000 100%)', border: 'rgba(255,255,255,0.2)', glow: 'transparent' };
    
    if (buttonStyle === 'Glass') {
      return {
        className: `${size} text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 shadow-xl border border-white/15 relative overflow-hidden`,
        style: { backgroundColor: 'rgba(25, 25, 25, 0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }
      };
    }
    return {
      className: `${size} text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 border-2 relative overflow-visible transition-shadow duration-300`,
      style: { background: sc.bg, borderColor: sc.border, boxShadow: `0 0 20px ${sc.glow}, inset 0 2px 4px rgba(255,255,255,0.3)` }
    };
  };

  return (
    <div className="flex flex-col gap-2 group">
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerCancel}
        onPointerCancel={handlePointerCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={handleItemClick}
        className={`rounded-xl cursor-pointer shadow-md relative overflow-hidden aspect-[5/7] select-none bg-neutral-900 transition-all duration-300 ${isPressing ? 'scale-[0.96] brightness-75' : 'scale-100'}`}
        style={{ touchAction: 'pan-x pan-y', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Full cover image */}
        <HanimeCoverSlider hanime={hanime} />

        <div 
          className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center gap-4 gpu-accelerated will-change-[opacity]" 
          style={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? 'auto' : 'none', transition: `opacity 300ms ${easeOutExpo}` }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isConfirming) setIsExpanded(false);
          }}
        >
          {isConfirming ? (
            <div className="flex flex-col items-center gap-3 px-2" onClick={e => e.stopPropagation()}>
              <span className="text-white text-[9px] font-black uppercase tracking-widest text-center">Delete?</span>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsConfirming(false); }} className={getBtnStyle('cancel', 'w-10 h-10').className} style={getBtnStyle('cancel', 'w-10 h-10').style}>
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <Icons.X size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(hanime.id); setIsExpanded(false); }} className={getBtnStyle('trash', 'w-10 h-10').className} style={getBtnStyle('trash', 'w-10 h-10').style}>
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <Icons.Trash size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-2" onClick={e => e.stopPropagation()}>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); navigate(`/manage-hanime/edit/${hanime.id}`, { state: { from: location.pathname + location.search } }); }} className={getBtnStyle('edit', 'w-10 h-10').className} style={getBtnStyle('edit', 'w-10 h-10').style}>
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <Icons.Edit size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsConfirming(true); }} className={getBtnStyle('trash', 'w-10 h-10').className} style={getBtnStyle('trash', 'w-10 h-10').style}>
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <Icons.Trash size={16} />
                </button>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="mt-2 text-white/40 text-[8px] font-black uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-1 mt-0.5 h-[2.75rem] flex items-start">
        <h3 
          className="text-[var(--text-primary)] font-bold text-[13px] tracking-tight line-clamp-2 leading-snug"
          title={toTitleCase(hanime.title)}
          style={{ fontFamily: "'Manga', 'Kalam', 'Patrick Hand', 'Comic Sans MS', cursive", letterSpacing: '0.5px' }}
        >
          {toTitleCase(hanime.title)}
        </h3>
      </div>
    </div>
  );
});

export const HanimeManagement: React.FC = () => {
  const { state, searchQuery, isHydrated, deleteHanime, pageRegistry, setPageRegistry } = useApp();
  const deferredSearchQuery = React.useDeferredValue(searchQuery);
  const navigate = useNavigate();
  const location = useLocation();
  const { sortOrder, itemsPerPage } = state.settings;

  const pageKey = useMemo(() => `${location.pathname}:${searchQuery}`, [location.pathname, searchQuery]);
  const [currentPage, setCurrentPage] = useState(() => pageRegistry[pageKey] || 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPageRegistry(prev => ({ ...prev, [pageKey]: currentPage }));
  }, [currentPage, pageKey, setPageRegistry]);

  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    });
  }, [location.pathname]);
  
  const filteredHanime = useMemo(() => {
    let hanime = state.hanime.filter(h => !h.isDeleted);
    
    if (deferredSearchQuery.trim()) {
      hanime = hanime.filter(h => 
        h.title.toLowerCase().includes(deferredSearchQuery.toLowerCase())
      );
    }

    return hanime.sort((a, b) => {
      if (sortOrder === 'Newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortOrder === 'Oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortOrder === 'DateDesc') return (b.assignedDate || b.createdAt || 0) - (a.assignedDate || a.createdAt || 0);
      if (sortOrder === 'DateAsc') return (a.assignedDate || a.createdAt || 0) - (b.assignedDate || b.createdAt || 0);
      if (sortOrder === 'A-Z') return a.title.localeCompare(b.title);
      if (sortOrder === 'Z-A') return b.title.localeCompare(a.title);
      return 0;
    });
  }, [state.hanime, deferredSearchQuery, sortOrder]);

  const paginatedHanime = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredHanime.slice(start, end);
  }, [filteredHanime, currentPage, itemsPerPage]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredHanime.length / itemsPerPage));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredHanime.length, itemsPerPage, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleHanimeClick = (id: string) => {
    navigate(`/hanime/${id}`, { state: { from: location.pathname + location.search } });
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.96 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        delay: i < 8 ? i * 0.04 : 0, // تأخير العناصر الأولى فقط لتجنب المعالجة الزائدة
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  if (!isHydrated) return null;

  return (
    <div className="max-w-2xl mx-auto px-3.5 pb-3.5 pt-3.5 animate-slide-in gpu-accelerated">
      <div className="grid grid-cols-2 gap-3.5">
        {paginatedHanime.map((hanime, index) => (
          <motion.div 
            key={hanime.id} 
            custom={index}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -50px 0px" }}
          >
            <HanimeGridItem 
              hanime={hanime} 
              onClick={() => handleHanimeClick(hanime.id)}
              onDelete={deleteHanime}
            />
          </motion.div>
        ))}
      </div>
      
      {filteredHanime.length > 0 && (
        <PaginationBar 
          currentPage={currentPage}
          totalLinks={filteredHanime.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}

      {filteredHanime.length === 0 && (
        <div className="py-32 text-center w-full">
          <div className="text-[var(--text-muted)] font-black uppercase tracking-[0.4em] text-[10px] opacity-20">
            {searchQuery ? 'No matching records found' : 'Registry Empty'}
          </div>
        </div>
      )}
    </div>
  );
};
