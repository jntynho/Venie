import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { HanimeEpisode } from '../types';
import { InputBar } from '../components/InputBar';
import { DateSelector } from '../components/DateSelector';
import { CoverPreview } from '../components/CoverPreview';
import { Icons } from '../constants';

export const AddEditHanime: React.FC = () => {
  const { id } = useParams();
  const { state, addHanime, updateHanime, isHydrated, hanimeDraft, setHanimeDraft } = useApp();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverOffset, setCoverOffset] = useState(50);
  const [description, setDescription] = useState('');
  const [episodes, setEpisodes] = useState<HanimeEpisode[]>([]);
  const [assignedDate, setAssignedDate] = useState<number | undefined>();
  const [censorship, setCensorship] = useState<'UNCENSORED' | 'CENSORED'>('UNCENSORED');
  const [secondaryCovers, setSecondaryCovers] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  const isSaving = useRef(false);
  const isNavigatingToSubPage = useRef(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!isHydrated || initialized.current) return;

    // If there's a draft for THIS specific ID, use it
    if (hanimeDraft && hanimeDraft.id === (id || null)) {
      setTitle(hanimeDraft.title);
      setCoverImage(hanimeDraft.coverImage);
      setCoverOffset(hanimeDraft.coverOffset ?? 50);
      setDescription(hanimeDraft.description);
      setEpisodes(hanimeDraft.episodes);
      setAssignedDate(hanimeDraft.assignedDate);
      setCensorship(hanimeDraft.censorship || 'UNCENSORED');
      setSecondaryCovers(hanimeDraft.secondaryCovers);
      initialized.current = true;
    } else if (id) {
      const hanime = state.hanime.find(h => h.id === id);
      if (hanime) {
        setTitle(hanime.title);
        setCoverImage(hanime.coverImage);
        setCoverOffset(hanime.coverOffset ?? 50);
        setDescription(hanime.description || '');
        setEpisodes(hanime.episodes);
        setAssignedDate(hanime.assignedDate);
        setCensorship(hanime.censorship || 'UNCENSORED');
        setSecondaryCovers(hanime.secondaryCovers || []);
        initialized.current = true;
      }
    } else {
      initialized.current = true;
    }
  }, [id, state.hanime, isHydrated, hanimeDraft]);

  // Sync state to draft
  useEffect(() => {
    if (!initialized.current) return;
    setHanimeDraft({
      id: id || null,
      title,
      coverImage,
      coverOffset,
      description,
      episodes,
      assignedDate,
      censorship,
      secondaryCovers
    });
  }, [id, title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers, setHanimeDraft]);

  const handleSave = useCallback(() => {
    if (!title.trim() || !coverImage.trim()) {
      alert("Please fill in both Hanime Name and Cover Image URL.");
      return;
    }
    isSaving.current = true;
    if (id) {
      updateHanime(id, { title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers });
    } else {
      addHanime({ title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers });
    }
    setHanimeDraft(null);
    navigate('/manage-hanime');
  }, [id, title, coverImage, coverOffset, description, episodes, assignedDate, censorship, secondaryCovers, updateHanime, addHanime, navigate, setHanimeDraft]);

  useEffect(() => {
    const trigger = () => handleSave();
    window.addEventListener('vault-save-trigger', trigger);
    return () => window.removeEventListener('vault-save-trigger', trigger);
  }, [handleSave]);

  // Clear draft when leaving the page (unless going to second covers)
  useEffect(() => {
    return () => {
      if (!isSaving.current && !isNavigatingToSubPage.current) {
        setHanimeDraft(null);
      }
    };
  }, [setHanimeDraft]);

  if (!isHydrated) return <div className="p-4 text-center text-[var(--text-muted)]">Loading...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl mx-auto p-4 pb-48 flex flex-col gap-y-6"
    >
      <div className="flex flex-col gap-y-6">
        <InputBar label="Hanime Name" value={title} onChange={setTitle} placeholder="Hanime Name..." showPaste />
        <InputBar 
            label="Cover Image URL" 
            value={coverImage} 
            onChange={setCoverImage} 
            placeholder="Cover Image URL..." 
            showPaste 
            rightElement={
                <>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-10 h-10 flex items-center justify-center text-[var(--accent)] active:scale-75 transition-transform"
                        title="Upload locally"
                    >
                        <Icons.Plus />
                    </button>
                </>
            }
        />
        
        <div className="w-full">
          <CoverPreview 
            url={coverImage} 
            ratio={'16:9'} 
            objectFit="contain"
            offset={coverOffset} 
            onOffsetChange={setCoverOffset} 
            onAutoSelect={() => {}} 
            isProcessing={false}
            assignedDate={assignedDate}
            onDateChange={setAssignedDate}
            episodes={episodes}
          />
        </div>

        <button
          onClick={() => {
            isNavigatingToSubPage.current = true;
            navigate('/manage-hanime/second-covers');
          }}
          className="w-full h-12 rounded-full text-sm font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
          style={{ backgroundColor: state.settings.buttonColor }}
        >
          Add Second Covers {secondaryCovers.length > 0 && `(${secondaryCovers.length})`}
        </button>
        <button
          onClick={() => {
            isNavigatingToSubPage.current = true;
            navigate('/manage-hanime/episodes');
          }}
          className="w-full h-12 rounded-full text-sm font-bold text-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg"
          style={{ backgroundColor: episodes.length > 0 ? '#22c55e' : state.settings.buttonColor }}
        >
          {episodes.length > 0 ? (
            <>
              Edit Episodes ({episodes.length})
            </>
          ) : (
            <>
              Add episode
            </>
          )}
        </button>
        <InputBar label="Description" value={description} onChange={setDescription} placeholder="Description..." showPaste />
      </div>

      <div className="flex flex-col gap-y-2 w-full">
        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] px-6">Censorship</label>
        <div className="flex gap-3 w-full">
          {(['UNCENSORED', 'CENSORED'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCensorship(c)}
              className={`flex-1 h-12 rounded-full font-black text-[10px] uppercase tracking-widest transition-all border ${censorship === c ? 'text-[var(--surface)] border-transparent shadow-lg' : 'bg-[var(--surface)] text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]'}`}
              style={censorship === c ? { backgroundColor: state.settings.buttonColor } : {}}
            >
              {c}
            </button>
          ))}
        </div>
      </div>


    </motion.div>
  );
};
