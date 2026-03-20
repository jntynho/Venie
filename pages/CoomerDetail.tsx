
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { CoomerPost } from '../types';
import { LoadingSpinner } from '../components/SkeletonCard';

const PostCard: React.FC<{ 
  post: CoomerPost; 
  onClick: (imageIndex: number) => void;
  onLongPress: () => void;
}> = ({ post, onClick, onLongPress }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Prevent default to stop browser from showing context menu or image preview
    if (e.pointerType === 'touch') {
      // On touch devices, we need to be careful not to block scrolling
    }
    
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    
    // Clear any existing timer
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    longPressTimer.current = window.setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      onLongPress();
      longPressTimer.current = null;
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // If the pointer moves significantly (e.g. scrolling), cancel the long press
    // We use a small threshold for movement
    if (longPressTimer.current) {
      // Simple check: if it moves, it's likely a scroll or drag
      handlePointerUp();
    }
  };

  return (
    <div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerMove={handlePointerMove}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Only trigger click if long press didn't happen
        if (!longPressTimer.current) {
          onClick(0);
        } else {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      className="aspect-[3/4] bg-neutral-900 overflow-hidden relative active:opacity-90 transition-opacity cursor-pointer group select-none"
      style={{ touchAction: 'pan-y', WebkitTouchCallout: 'none' }}
    >
      {isVisible ? (
        <>
          {/* Skeleton Placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-neutral-800 animate-pulse z-0" />
          )}
          
          {post.urls[0] && (
            <img 
              src={post.urls[0]} 
              loading="lazy"
              draggable="false"
              onLoad={() => setIsLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-700 pointer-events-none ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
              alt=""
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Error';
                setIsLoaded(true);
              }}
            />
          )}

          {post.type === 'Multiple' && (
            <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none group-active:scale-90 transition-transform drop-shadow-md">
              <div className="relative w-4 h-4">
                {/* Back Layer */}
                <div className="absolute top-0 right-0 w-[13px] h-[13px] border-[1.5px] border-white rounded-[2px] opacity-60" />
                {/* Front Layer */}
                <div className="absolute bottom-0 left-0 w-[13px] h-[13px] bg-white rounded-[2px]" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
    </div>
  );
};

export const CoomerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, coomerActiveTab, setCoomerActiveTab, updateCoomer, isHydrated } = useApp();

  useEffect(() => {
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent('restore-scroll'));
    });
  }, [location.pathname, coomerActiveTab]);

  const coomer = useMemo(() => state.coomers.find(c => c.id === id), [state.coomers, id]);

  const posts = useMemo(() => {
    if (!coomer) return [];
    const rawPosts = coomerActiveTab === 'Instagram' ? (coomer.instagramPosts || []) : (coomer.onlyFansPosts || []);
    return [...rawPosts].sort((a, b) => {
      const dateA = a.date || a.createdAt || 0;
      const dateB = b.date || b.createdAt || 0;
      return dateB - dateA; // Newest first
    });
  }, [coomer, coomerActiveTab]);

  // Migration logic
  useEffect(() => {
    if (coomer && (coomer.instagramLinks?.length || coomer.onlyFansLinks?.length)) {
      const updates: any = {};
      
      if (coomer.instagramLinks?.length && !coomer.instagramPosts?.length) {
        updates.instagramPosts = coomer.instagramLinks.map(url => ({
          id: Math.random().toString(36).substr(2, 9),
          urls: [url],
          type: 'Single',
          createdAt: Date.now()
        }));
        updates.instagramLinks = [];
      }

      if (coomer.onlyFansLinks?.length && !coomer.onlyFansPosts?.length) {
        updates.onlyFansPosts = coomer.onlyFansLinks.map(url => ({
          id: Math.random().toString(36).substr(2, 9),
          urls: [url],
          type: 'Single',
          createdAt: Date.now()
        }));
        updates.onlyFansLinks = [];
      }

      if (Object.keys(updates).length > 0) {
        updateCoomer(coomer.id, updates);
      }
    }
  }, [coomer, updateCoomer]);

  if (!isHydrated) return null;

  if (!coomer) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30">
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Registry Entry Not Found</span>
      </div>
    );
  }

  const handlePostClick = (postIndex: number, imageIndex: number) => {
    navigate(`/coomer/${id}/media/${coomerActiveTab}/${postIndex}?img=${imageIndex}`);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col animate-slide-in pb-20">
      {/* Header Profile Section */}
      <div className="flex flex-col items-center pt-3 pb-5">
        <div 
          className="w-24 h-24 rounded-full border-[3px] overflow-hidden bg-neutral-800 shadow-2xl relative ring-4 ring-black/20"
          style={{ borderColor: state.settings.circleBorderColor }}
        >
          {(coomer.originalImageUrl || coomer.imageUrl) && (
            <img 
              src={coomer.originalImageUrl || coomer.imageUrl} 
              className="w-full h-full object-cover" 
              alt={coomer.name}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
        <h1 className="mt-3 text-[20px] font-black tracking-tight text-[var(--text-primary)]">
          {coomer.name}
        </h1>
      </div>

      {/* Tabs Section */}
      <div className="flex border-b border-[var(--border)] bg-[var(--bg)]">
        <button 
          onClick={() => setCoomerActiveTab('Instagram')}
          className="flex-1 py-4 relative transition-all active:scale-95 tap-highlight-none flex flex-col items-center justify-center gap-1"
        >
          <div className={`transition-all duration-300 ${coomerActiveTab === 'Instagram' ? 'scale-110 text-white' : 'scale-100 opacity-20 text-white'}`}>
            <Icons.Instagram />
          </div>
          {coomerActiveTab === 'Instagram' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)] animate-slide-in" />
          )}
        </button>
        <button 
          onClick={() => setCoomerActiveTab('OnlyFans')}
          className="flex-1 py-4 relative transition-all active:scale-95 tap-highlight-none flex flex-col items-center justify-center gap-1"
        >
          <div className={`transition-all duration-300 ${coomerActiveTab === 'OnlyFans' ? 'scale-110 text-white' : 'scale-100 opacity-20 text-white'}`}>
            <Icons.OnlyFans />
          </div>
          {coomerActiveTab === 'OnlyFans' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--text-primary)] animate-slide-in" />
          )}
        </button>
      </div>

      {/* Media Grid Section */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={coomerActiveTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="grid grid-cols-3 gap-[2px] pt-[2px]"
        >
          {posts.length > 0 ? (
            posts.map((post, idx) => (
              <PostCard 
                key={post.id || idx} 
                post={post} 
                onClick={(imgIdx) => handlePostClick(idx, imgIdx)} 
                onLongPress={() => navigate(`/coomer/${id}/add-socials/${post.id}`)}
              />
            ))
          ) : (
            <div className="col-span-3 py-20 flex flex-col items-center justify-center opacity-20">
              <div className="mb-4 scale-150">
                {coomerActiveTab === 'Instagram' ? <Icons.LayoutDashboard /> : <Icons.Scale />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Media Found</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
