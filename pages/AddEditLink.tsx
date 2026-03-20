
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Icons } from '../constants';
import { AspectRatio, Tag, Actor, LinkItem } from '../types';
import { ActorSelector } from '../components/ActorSelector';
import { TagSelector } from '../components/TagSelector';
import { DateSelector } from '../components/DateSelector';
import { CoverPreview } from '../components/CoverPreview';
import { InputBar } from '../components/InputBar';
import { useLinkDetection } from '../hooks/useLinkDetection';






export const AddEditLink: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, addLink, updateLink, formDraft, setFormDraft, addNotification, isHydrated } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isSaving = useRef(false);
  const isNavigatingToSubPage = useRef(false);
  
  const [isLocked, setIsLocked] = useState(true);
  const toggleLock = useCallback(() => setIsLocked(prev => !prev), []);
  
  const existing = useMemo(() => id ? state.links.find(l => l.id === id) : null, [state.links, id]);

  const [title, setTitle] = useState(() => (formDraft?.id === (id || null) ? formDraft?.title : existing?.title) || '');
  const [urlHD, setUrlHD] = useState(() => (formDraft?.id === (id || null) ? formDraft?.urlHD : existing?.urlHD) || '');
  const [url4K, setUrl4K] = useState(() => (formDraft?.id === (id || null) ? formDraft?.url4K : existing?.url4K) || '');
  const [coverImage, setCoverImage] = useState(() => (formDraft?.id === (id || null) ? formDraft?.coverImage : existing?.coverImage) || '');
  const [coverOffset, setCoverOffset] = useState(() => (formDraft?.id === (id || null) ? (formDraft as any)?.coverOffset : existing?.coverOffset) ?? 50);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => (formDraft?.id === (id || null) ? formDraft?.aspectRatio : existing?.aspectRatio) || '16:9');
  const [assignedDate, setAssignedDate] = useState<number | undefined>(() => (formDraft?.id === (id || null) ? formDraft?.assignedDate : existing?.assignedDate));
  const [selectedActorIds, setSelectedActorIds] = useState<string[]>(() => {
    if (formDraft?.id === (id || null)) return formDraft?.actorIds || [];
    if (existing) return existing.actorIds || [];
    
    // Check query params for new link
    const params = new URLSearchParams(location.search);
    const actorId = params.get('actor');
    return actorId ? [actorId] : [];
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(() => {
    if (formDraft?.id === (id || null)) return formDraft?.tagIds || [];
    if (existing) return existing.tagIds || [];
    
    // Check query params for new link
    const params = new URLSearchParams(location.search);
    const tagId = params.get('tag');
    return tagId ? [tagId] : [];
  });
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => (formDraft?.id === (id || null) ? formDraft?.galleryUrls : existing?.galleryUrls) || []);
  
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isHydrated && id && existing && !hasInitialized.current) {
      // Only populate if we don't have a matching draft or if the draft is empty
      const useExisting = !formDraft || formDraft.id !== id;
      
      if (useExisting) {
        setTitle(existing.title || '');
        setUrlHD(existing.urlHD || '');
        setUrl4K(existing.url4K || '');
        setCoverImage(existing.coverImage || '');
        setCoverOffset(existing.coverOffset ?? 50);
        setAspectRatio(existing.aspectRatio || '16:9');
        setAssignedDate(existing.assignedDate);
        setSelectedActorIds(existing.actorIds || []);
        setSelectedTagIds(existing.tagIds || []);
        setGalleryUrls(existing.galleryUrls || []);
      }
      hasInitialized.current = true;
    }
  }, [isHydrated, id, existing, formDraft]);

  const [actorSearch, setActorSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [isFetchingThumb, setIsFetchingThumb] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  const { performIntelligentDetection } = useLinkDetection(state.actors, state.tags, setSelectedActorIds, setSelectedTagIds, setAspectRatio);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const draftData = { 
        id: id || null,
        title, urlHD, url4K, coverImage, aspectRatio, 
        actorIds: selectedActorIds, tagIds: selectedTagIds, galleryUrls,
        coverOffset, assignedDate
      };
      setFormDraft(draftData as any);
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (!isSaving.current && !isNavigatingToSubPage.current) {
        setFormDraft(null);
      }
    };
  }, [title, urlHD, url4K, coverImage, coverOffset, aspectRatio, selectedActorIds, selectedTagIds, galleryUrls, id, setFormDraft, assignedDate]);

  const handleAutoSelect = useCallback(() => {
    if (galleryUrls.length === 0) {
      addNotification("No staged gallery images found to select from.", "error");
      return;
    }

    setIsAutoSelecting(true);

    const analyzeImages = async () => {
      const candidates: { url: string; ratio: number; priority: number }[] = [];
      
      const promises = galleryUrls.map(url => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (img.width >= img.height) {
              const ratio = img.width / img.height;
              let priority = 3; 
              
              if (Math.abs(ratio - (16/9)) < 0.1) {
                priority = 1;
              } 
              else if (Math.abs(ratio - (3/2)) < 0.1) {
                priority = 2;
              }
              
              candidates.push({ url, ratio, priority });
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        });
      });

      await Promise.all(promises);

      candidates.sort((a, b) => a.priority - b.priority);

      const selected = candidates.slice(0, 5).map(c => c.url);
      
      if (selected.length > 0) {
        if (navigator.vibrate) navigator.vibrate(50);
        addNotification("Gallery assets auto-selected.", "success");
      } else {
        addNotification("No landscape-oriented images found in the gallery buffer.", "error");
      }
      setIsAutoSelecting(false);
    };

    analyzeImages();
  }, [galleryUrls, addNotification]);

  const checkDuplicate = (value: string, field: keyof typeof state.links[0]) => {
    const trimmed = value?.trim();
    if (!trimmed) return false;
    return state.links.some(l => l.id !== id && !l.isDeleted && String(l[field]).trim() === trimmed);
  };

  const isTitleDup = useMemo(() => checkDuplicate(title, 'title'), [title, id, state.links]);
  const isHdDup = useMemo(() => checkDuplicate(urlHD, 'urlHD'), [urlHD, id, state.links]);
  const is4kDup = useMemo(() => checkDuplicate(url4K, 'url4K'), [url4K, id, state.links]);
  const isCoverDup = useMemo(() => checkDuplicate(coverImage, 'coverImage'), [coverImage, id, state.links]);

  const prevTitleRef = useRef('');
  useEffect(() => {
    if (id) return; 
    
    const trimmedTitle = title.trim();
    if (trimmedTitle === prevTitleRef.current || !trimmedTitle) return;
    prevTitleRef.current = trimmedTitle;

    const timer = setTimeout(() => {
      performIntelligentDetection(trimmedTitle, selectedTagIds);
    }, 800);
    return () => clearTimeout(timer);
  }, [title, id, performIntelligentDetection, selectedTagIds]);

  const isValidUrl = (urlString: string) => {
    if (!urlString.trim()) return true;
    try { new URL(urlString); return true; }
    catch(e){ return false; }
  };

  const handleSave = useCallback(() => {
    isSaving.current = true;
    if (!title.trim()) {
      addNotification("Please provide a title.", "error");
      isSaving.current = false;
      return;
    }
    
    if (!isValidUrl(urlHD) || !isValidUrl(url4K) || !isValidUrl(coverImage)) {
      addNotification("Please provide valid URLs.", "error");
      isSaving.current = false;
      return;
    }
    
    if (isTitleDup || isHdDup || is4kDup || isCoverDup) {
      addNotification("Duplicate values detected. Please resolve them.", "error");
      isSaving.current = false;
      return;
    }
    
    const data = { 
      title: title.trim(), 
      urlHD: urlHD.trim(), 
      url4K: url4K.trim(), 
      coverImage: coverImage.trim(), 
      coverOffset,
      aspectRatio, 
      actorIds: selectedActorIds, 
      tagIds: selectedTagIds, 
      galleryUrls,
      assignedDate
    };

    if (id) {
      updateLink(id, data);
    } else {
      addLink(data);
    }
    
    setFormDraft(null); 
    addNotification("Link saved successfully.", "success");
    navigate((location.state as any)?.from || '/', { replace: true });
  }, [title, urlHD, url4K, coverImage, coverOffset, aspectRatio, selectedActorIds, selectedTagIds, galleryUrls, id, addLink, updateLink, navigate, setFormDraft, addNotification, isTitleDup, isHdDup, is4kDup, isCoverDup, assignedDate, location.state]);

  useEffect(() => {
    const trigger = () => handleSave();
    window.addEventListener('vault-save-trigger', trigger);
    return () => window.removeEventListener('vault-save-trigger', trigger);
  }, [handleSave]);

  const currentPath = location.pathname + location.search;

  if (!isHydrated) return <div className="p-4 text-center text-[var(--text-muted)]">Loading...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="max-w-2xl mx-auto flex flex-col pb-48 px-4 pt-6"
    >
      <div className="flex flex-col mb-10 gap-y-4">
        <InputBar label="Title" value={title} onChange={setTitle} placeholder="Link description..." showPaste isDuplicate={isTitleDup} />
        
        <div className="flex flex-col border-b border-[var(--border)] py-4 gap-4">
          <div className="flex items-center justify-between px-1">
            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">Gallery Assets</label>
            {galleryUrls.length > 0 && <span className="text-[10px] font-black text-[var(--accent)] uppercase tracking-widest">{galleryUrls.length} items</span>}
          </div>
          <button
            type="button"
            onClick={() => {
              isNavigatingToSubPage.current = true;
              navigate('/add-gallery', { state: { from: currentPath } });
            }}
            className={`w-full py-3 rounded-full font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] text-[var(--surface)] shadow-md`}
            style={{ backgroundColor: state.settings.buttonColor }}
          >
             {galleryUrls.length > 0 ? 'Edit Staged Gallery' : 'Create Gallery Buffer'}
          </button>
        </div>

        <InputBar label="HD URL" value={urlHD} onChange={setUrlHD} placeholder="Standard link..." showPaste isDuplicate={isHdDup} />
        <InputBar label="4K URL" value={url4K} onChange={setUrl4K} placeholder="Ultra HD link..." showPaste isDuplicate={is4kDup} />
        <InputBar 
          label="Cover Image" value={coverImage} onChange={setCoverImage} placeholder="Image URL..." showPaste
          isLoading={isFetchingThumb}
          isDuplicate={isCoverDup}
          rightElement={
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="w-10 h-10 flex items-center justify-center text-[var(--accent)] active:scale-75 transition-transform"
              title="Upload locally"
            >
              <Icons.Plus />
            </button>
          }
        />
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) {
            const r = new FileReader();
            r.onloadend = async () => {
              setCoverImage(r.result as string);
            };
            r.readAsDataURL(f);
          }
        }} />

        <CoverPreview 
          url={coverImage} 
          ratio={aspectRatio} 
          offset={coverOffset} 
          onOffsetChange={setCoverOffset} 
          onAutoSelect={handleAutoSelect}
          isProcessing={isAutoSelecting}
          assignedDate={assignedDate}
          onDateChange={setAssignedDate}
          isLocked={isLocked}
          onToggleLock={toggleLock}
          episodes={[]}
        />
      </div>

      <div className="flex gap-3 mb-10 px-1">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Ratio</label>
          <div className="flex gap-2">
            {(['16:9', '3:2'] as AspectRatio[]).map(ratio => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`flex-1 py-3 rounded-full border font-black text-[10px] uppercase tracking-widest transition-all ${aspectRatio === ratio ? 'text-[var(--surface)] border-transparent shadow-lg' : 'bg-white/5 text-[var(--text-muted)] border-[var(--border)]'}`}
                style={aspectRatio === ratio ? { backgroundColor: state.settings.buttonColor } : {}}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>


      <ActorSelector
        actorSearch={actorSearch}
        setActorSearch={setActorSearch}
        selectedActorIds={selectedActorIds}
        setSelectedActorIds={setSelectedActorIds}
        currentPath={currentPath}
      />

      <TagSelector
        tagSearch={tagSearch}
        setTagSearch={setTagSearch}
        selectedTagIds={selectedTagIds}
        setSelectedTagIds={setSelectedTagIds}
        currentPath={currentPath}
      />
    </motion.div>
  );
};
