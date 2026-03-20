import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LinkItem, DisplaySize, ButtonStyle, Actor, Tag, AppSettings } from '../types';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toTitleCase } from '../utils/format';

interface LinkCardProps {
  link: LinkItem;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  noSideMargins?: boolean;
  deleteLink: (id: string) => void;
  actorMap: Map<string, Actor>;
  tagMap: Map<string, Tag>;
  settings: AppSettings;
}

const getTitleFontSize = (size: DisplaySize) => {
  switch (size) {
    case 'Small': return '0.85rem';
    case 'Large': return '1.1rem';
    default: return '1rem';
  }
};

const getMetaFontSize = (size: DisplaySize) => {
  switch (size) {
    case 'Small': return '0.85rem'; 
    case 'Large': return '1.05rem';
    default: return '0.92rem'; 
  }
};

const getButtonStyle = (style: ButtonStyle, btnId: string) => {
  const semanticColors: Record<string, { bg: string, border: string, glow: string }> = {
    trash: { bg: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)', border: 'rgba(255,255,255,0.4)', glow: 'rgba(239, 68, 68, 0.5)' },
    cancel: { bg: 'linear-gradient(135deg, #4b5563 0%, #1f2937 100%)', border: 'rgba(255,255,255,0.3)', glow: 'rgba(0,0,0,0.3)' },
    edit: { bg: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', border: 'rgba(255,255,255,0.4)', glow: 'rgba(34, 197, 94, 0.5)' },
    hd: { bg: 'linear-gradient(135deg, #0ea5e9 0%, #075985 100%)', border: 'rgba(255,255,255,0.4)', glow: 'rgba(14, 165, 233, 0.5)' },
    '4k': { bg: 'linear-gradient(135deg, #eab308 0%, #854d0e 100%)', border: 'rgba(255,255,255,0.4)', glow: 'rgba(234, 179, 8, 0.5)' }
  };

  const solidColors: Record<string, { bg: string, border: string, glow: string }> = {
    trash: { bg: '#ef4444', border: 'rgba(255,255,255,0.4)', glow: 'rgba(239, 68, 68, 0.5)' },
    cancel: { bg: '#4b5563', border: 'rgba(255,255,255,0.3)', glow: 'rgba(0,0,0,0.3)' },
    edit: { bg: '#22c55e', border: 'rgba(255,255,255,0.4)', glow: 'rgba(34, 197, 94, 0.5)' },
    hd: { bg: '#0ea5e9', border: 'rgba(255,255,255,0.4)', glow: 'rgba(14, 165, 233, 0.5)' },
    '4k': { bg: '#eab308', border: 'rgba(255,255,255,0.4)', glow: 'rgba(234, 179, 8, 0.5)' }
  };

  switch (style) {
    case 'ColorGlass': {
      const sc = semanticColors[btnId] || { bg: 'linear-gradient(135deg, #333 0%, #000 100%)', border: 'rgba(255,255,255,0.2)', glow: 'transparent' };
      return {
        className: "w-14 h-14 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 border-2 relative overflow-visible transition-shadow duration-300",
        style: {
          background: sc.bg,
          borderColor: sc.border,
          boxShadow: `0 0 20px ${sc.glow}, inset 0 2px 4px rgba(255,255,255,0.3)`,
        }
      };
    }
    case 'SolidColors': {
      const sc = solidColors[btnId] || { bg: '#333', border: 'rgba(255,255,255,0.2)', glow: 'transparent' };
      return {
        className: "w-14 h-14 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 border-2 relative overflow-visible transition-shadow duration-300",
        style: {
          backgroundColor: sc.bg,
          borderColor: sc.border,
          boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3)`,
        }
      };
    }
    case 'Glass':
    default:
      return {
        className: "w-14 h-14 text-white rounded-full flex items-center justify-center shrink-0 active:scale-90 shadow-xl border border-white/15 relative overflow-hidden",
        style: {
          backgroundColor: 'rgba(25, 25, 25, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }
      };
  }
};

export const LinkCard: React.FC<LinkCardProps> = memo(({ 
  link, 
  isExpanded, 
  onToggle, 
  noSideMargins = false,
  deleteLink,
  actorMap,
  tagMap,
  settings
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: contextActorId } = useParams();
  const { 
    metadataSize = 'Small', 
    titleSize = 'Medium', 
    blurIntensity = 30, 
    blurCovers = false,
    buttonStyle = 'Glass', 
    actorNameColor = '#3b82f6', 
    galleryBgColor = '#1a1a1acc', 
    showActorCheckmark = true, 
    accentColor = '#3b82f6' 
  } = settings || {};
  const [isConfirming, setIsConfirming] = useState(false);
  const [isShowingExtraActors, setIsShowingExtraActors] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isGalleryActive, setIsGalleryActive] = useState(false);
  const [inlineIndex, setInlineIndex] = useState(0);
  const [loadedGalleryImages, setLoadedGalleryImages] = useState<Record<number, boolean>>({});
  
  const cardRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const actors = useMemo(() => 
    link.actorIds.map(id => (actorMap || new Map<string, Actor>()).get(id)).filter((a): a is Actor => !!a && !a.isDeleted),
    [link.actorIds, actorMap]
  );
  
  const tags = useMemo(() => 
    (link.tagIds || []).map(id => (tagMap || new Map<string, Tag>()).get(id)).filter((t): t is Tag => !!t && !t.isDeleted),
    [link.tagIds, tagMap]
  );
  
  const primaryTag = tags[0];
  const primaryActor = actors.find(a => a.id === contextActorId) || actors[0];
  const otherActors = actors.filter(a => a.id !== primaryActor?.id);

  const aspectRatio = link.aspectRatio || '16:9';
  const isAltRatio = aspectRatio === '3:2';

  const toggleExtraActors = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsShowingExtraActors(prev => !prev);
  };

  useEffect(() => {
    if (!isExpanded) {
      const timer = setTimeout(() => {
        setIsConfirming(false);
        setIsShowingExtraActors(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const navigateWithContext = useCallback((path: string) => {
    navigate(path, { state: { from: location.pathname + location.search } });
  }, [navigate, location]);

  const handleLongPress = useCallback(() => {
    if (link.galleryUrls && link.galleryUrls.length > 0) {
      if (navigator.vibrate) navigator.vibrate(50);
      setIsGalleryActive(prev => !prev);
      setInlineIndex(0);
    }
  }, [link.galleryUrls]);

  const startLongPress = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    longPressTimer.current = window.setTimeout(handleLongPress, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleGalleryImageLoad = (idx: number) => {
    setLoadedGalleryImages(prev => ({ ...prev, [idx]: true }));
  };

  const handleInlineScroll = () => {
    if (scrollRef.current) {
      const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.clientWidth);
      if (idx !== inlineIndex) setInlineIndex(idx);
    }
  };

  const springBezier = "cubic-bezier(0.16, 1, 0.3, 1)";
  const easeOutExpo = "cubic-bezier(0.19, 1, 0.22, 1)";

  const actions = useMemo(() => {
    const acts = [];
    if (link.urlHD) {
      acts.push({ 
        id: 'hd', 
        icon: buttonStyle === 'SolidColors' ? <Icons.Play /> : <Icons.HD />, 
        action: () => window.open(link.urlHD, '_blank') 
      });
    }
    if (link.url4K) {
      acts.push({ 
        id: '4k', 
        icon: buttonStyle === 'SolidColors' ? <Icons.Play /> : <Icons.FourK />, 
        action: () => window.open(link.url4K, '_blank') 
      });
    }
    acts.push({ id: 'edit', icon: <Icons.Edit />, action: () => navigate(`/edit/${link.id}`, { state: { from: location.pathname + location.search } }) });
    acts.push({ id: 'trash', icon: <Icons.Trash />, action: () => setIsConfirming(true) });
    return acts;
  }, [link.id, link.urlHD, link.url4K, navigate, buttonStyle, location.pathname, location.search]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    hidden: { x: 5, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.15, ease: "easeOut" } },
    exit: { x: 5, opacity: 0, transition: { duration: 0.15, ease: "easeIn" } }
  };

  return (
    <div 
      ref={cardRef}
      className="flex flex-col w-full overflow-hidden gpu-accelerated group transition-[background-color] duration-500"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <div 
        onPointerDown={startLongPress}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onClick={() => {
          if (isGalleryActive) return; 
          if (isShowingExtraActors) setIsShowingExtraActors(false);
          else onToggle(link.id);
        }}
        className={`relative w-full cursor-pointer overflow-hidden bg-[var(--surface)] transition-[background-color] duration-500 ${isAltRatio ? 'aspect-[3/2]' : 'aspect-video'}`}
      >
        {!imgLoaded && !isGalleryActive && (
          <div className="absolute inset-0 bg-white/[0.03] overflow-hidden z-0">
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-[shimmer_1.5s_infinite]" />
          </div>
        )}
        
        {!isGalleryActive && link.coverImage && (
          <div className="absolute inset-0 transition-transform duration-700 ease-out" style={{ transform: (isExpanded || isShowingExtraActors) ? 'scale(1.08)' : 'scale(1)' }}>
            <img 
              src={link.coverImage}
              alt={link.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                objectPosition: `center ${link.coverOffset ?? 50}%`,
                opacity: 1,
                transition: 'opacity 1200ms ease-in-out',
                zIndex: 2,
                visibility: imgLoaded ? 'visible' : 'hidden',
                filter: blurCovers ? `blur(${blurIntensity}px)` : 'none'
              }}
            />
          </div>
        )}

        {isGalleryActive && (
          <div className="absolute inset-0 animate-slide-in flex flex-col backdrop-blur-3xl z-[50]" style={{ backgroundColor: galleryBgColor }}>
            <div ref={scrollRef} onScroll={handleInlineScroll} className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gpu-accelerated">
              {(link.galleryUrls || []).map((url, i) => (
                <div key={i} className="w-full h-full shrink-0 snap-center relative flex items-center justify-center" onClick={(e) => { e.stopPropagation(); navigate(`/preview/${link.id}?index=${i}&type=standard`); }}>
                  {!loadedGalleryImages[i] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 animate-pulse">
                      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
                    </div>
                  )}
                  {url && <img src={url} onLoad={() => handleGalleryImageLoad(i)} className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${loadedGalleryImages[i] ? 'opacity-100' : 'opacity-0'}`} alt="" />}
                </div>
              ))}
            </div>
            <div className="absolute top-4 left-5 z-[30] pointer-events-none">
              <span className="text-[12px] font-black text-white/70 tracking-[0.12em] select-none pointer-events-auto leading-none">{inlineIndex + 1}/{link.galleryUrls?.length}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setIsGalleryActive(false); }} className="absolute top-4 right-5 z-[30] w-10 h-10 rounded-full bg-black/40 backdrop-blur-[32px] border border-white/15 flex items-center justify-center text-white active:scale-90 transition-all pointer-events-auto shadow-md">
              <Icons.X />
            </button>
          </div>
        )}
        
        {link.coverImage && <img src={link.coverImage} className="hidden" onLoad={() => setImgLoaded(true)} loading="eager" alt="" />}

        <div className="absolute inset-0 bg-black/70 transition-opacity duration-400 ease-out z-10" style={{ opacity: (isExpanded || isShowingExtraActors) ? 1 : 0, pointerEvents: 'none', backdropFilter: (isExpanded || isShowingExtraActors) ? `blur(${blurIntensity/10}px)` : 'none', WebkitBackdropFilter: (isExpanded || isShowingExtraActors) ? `blur(${blurIntensity/10}px)` : 'none' }} />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[20] gpu-accelerated overflow-hidden will-change-[opacity]" style={{ opacity: isExpanded ? 1 : 0, pointerEvents: isExpanded ? 'auto' : 'none', transition: `opacity 400ms ${easeOutExpo}` }}>
          <div className="flex flex-wrap items-center justify-center gap-6 px-10 max-w-full">
            {isConfirming ? (
              <>
                <button onClick={(e) => handleAction(e, () => setIsConfirming(false))} className={getButtonStyle(buttonStyle, 'cancel').className} style={{ ...getButtonStyle(buttonStyle, 'cancel').style, transform: isExpanded ? 'translateY(0) scale(1.1)' : 'translateY(40px) scale(0.2)', opacity: isExpanded ? 1 : 0, transition: `transform 550ms ${springBezier}, opacity 350ms ease-out`, transitionDelay: `0ms`, willChange: 'transform, opacity' }}>
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <Icons.X />
                </button>
                <button onClick={(e) => handleAction(e, () => deleteLink(link.id))} className={getButtonStyle(buttonStyle === 'ColorGlass' ? 'ColorGlass' : 'Glass', 'trash').className} style={{ ...getButtonStyle(buttonStyle === 'ColorGlass' ? 'ColorGlass' : 'Glass', 'trash').style, transform: isExpanded ? 'translateY(0) scale(1.1)' : 'translateY(40px) scale(0.2)', opacity: isExpanded ? 1 : 0, transition: `transform 550ms ${springBezier}, opacity 350ms ease-out`, transitionDelay: `45ms`, willChange: 'transform, opacity' }}>
                  {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                  <div className="relative z-10 scale-110"><Icons.Trash /></div>
                </button>
              </>
            ) : (
              actions.map((btn, idx) => {
                const btnStyle = getButtonStyle(buttonStyle, btn.id);
                return (
                  <button 
                    key={btn.id} 
                    onClick={(e) => handleAction(e, btn.action)} 
                    className={btnStyle.className} 
                    style={{ 
                      ...btnStyle.style,
                      transform: isExpanded ? 'translateY(0) scale(1.1)' : 'translateY(40px) scale(0.2)',
                      opacity: isExpanded ? 1 : 0,
                      transition: `transform 550ms ${springBezier}, opacity 350ms ease-out`,
                      transitionDelay: `${idx * 45}ms`,
                      willChange: 'transform, opacity'
                    }}
                  >
                    {buttonStyle === 'Glass' && <div className="absolute inset-0 bg-black/30 -z-10" />}
                    <div className="relative z-10">{btn.icon}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] gpu-accelerated overflow-hidden will-change-[opacity]" style={{ opacity: isShowingExtraActors ? 1 : 0, pointerEvents: isShowingExtraActors ? 'auto' : 'none', transition: `opacity 400ms ${easeOutExpo}` }}>
          <div className="flex flex-wrap items-center justify-center gap-6 px-10 max-w-full">
            {actors.map((actor, idx) => (
              <div key={actor.id} onClick={(e) => handleAction(e, () => navigateWithContext(`/actor/${actor.id}`))} className="w-16 h-16 rounded-full shrink-0 cursor-pointer active:scale-90 relative group/actor" style={{ transform: isShowingExtraActors ? 'translateY(0) scale(1.1)' : 'translateY(40px) scale(0.2)', opacity: isShowingExtraActors ? 1 : 0, transition: `transform 550ms ${springBezier}, opacity 350ms ease-out`, transitionDelay: `${idx * 45}ms`, willChange: 'transform, opacity' }}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-800">
                  {(actor.originalImageUrl || actor.imageUrl) && <img 
                    src={actor.originalImageUrl || actor.imageUrl} 
                    className="w-full h-full object-cover" 
                    alt={actor.name}
                    referrerPolicy="no-referrer"
                  />}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/20 group-hover/actor:bg-transparent transition-colors duration-300 z-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="pl-3 pr-3 pt-3 pb-4 w-full transition-colors duration-500" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col items-start min-w-0 flex-1">
            <div className="flex items-center min-w-0 pr-2 h-6 mb-1">
              <div className="flex items-center gap-2 truncate min-w-0">
                {!primaryActor ? (
                  <span className="font-black uppercase tracking-[0.15em] leading-none" style={{ fontSize: getMetaFontSize(metadataSize), color: 'var(--text-muted)' }}>Unlabeled</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span 
                      onClick={(e) => handleAction(e, () => navigateWithContext(`/actor/${primaryActor.id}`))}
                      className="font-black tracking-[0.05em] leading-none cursor-pointer active:opacity-60 transition-all duration-300 whitespace-nowrap py-0.5" 
                      style={{ fontSize: getMetaFontSize(metadataSize), color: actorNameColor }}
                    >
                      {toTitleCase(primaryActor.name)}
                    </span>
                    {showActorCheckmark && (<div className="shrink-0 -ml-0.5"><Icons.Verified color={accentColor} /></div>)}
                    {otherActors.length > 0 && (
                      <button onClick={toggleExtraActors} className="flex items-center justify-center px-2 py-0.5 rounded-full transition-all active:scale-75 shrink-0 border border-transparent" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}25` }}>
                         <span className="text-[9px] font-black leading-none mt-[0.5px] uppercase tracking-tighter" style={{ color: accentColor }}>+{otherActors.length}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <h3 className="text-[var(--text-primary)] font-bold leading-tight tracking-tight text-left truncate w-full" style={{ fontSize: getTitleFontSize(titleSize) }}>{link.title}</h3>
          </div>
          <div className="flex flex-col items-end shrink-0 pl-4">
            <div className="flex items-center justify-end gap-x-2 text-[var(--text-secondary)] font-black uppercase tracking-widest h-6 mb-1" style={{ fontSize: '0.62rem' }}>
              {primaryTag && (<span className="whitespace-nowrap cursor-pointer opacity-60 hover:opacity-100 active:opacity-100 transition-opacity py-0.5" onClick={(e) => handleAction(e, () => navigateWithContext(`/tag/${primaryTag.id}`))}>{primaryTag.name}</span>)}
            </div>
            {link.assignedDate && link.assignedDate > 0 && (
              <div className="text-[0.65rem] font-black tracking-widest opacity-50" style={{ color: 'var(--text-secondary)' }}>
                {new Date(link.assignedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
