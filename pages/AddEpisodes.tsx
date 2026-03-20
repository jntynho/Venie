import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { HanimeEpisode } from '../types';
import { Icons } from '../constants';

const EpisodeItem: React.FC<{ ep: HanimeEpisode, onEdit: (ep: HanimeEpisode) => void, onDelete: (id: string) => void }> = (props) => {
  const { ep, onEdit, onDelete } = props;
  const [showActions, setShowActions] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    hidden: { x: 10, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
    exit: { x: 10, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
  };

  return (
    <div className="h-12 flex items-center pl-4 pr-1.5 mb-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-sm justify-between">
      <span className="truncate flex-1">Episode {ep.episodeNumber}</span>
      <div className="flex items-center gap-1.5">
        <AnimatePresence mode="wait">
          {showActions ? (
            <motion.div 
              key="actions-container"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center gap-1.5"
            >
              <AnimatePresence mode="wait">
                {isConfirming ? (
                  <motion.div key="confirm" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex gap-1.5">
                    <motion.button variants={itemVariants} onClick={() => setIsConfirming(false)} className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-500 text-white"><Icons.X size={16} /></motion.button>
                    <motion.button variants={itemVariants} onClick={() => onDelete(ep.id)} className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 text-white"><Icons.Check size={16} /></motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="edit-delete" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="flex gap-1.5">
                    <motion.button variants={itemVariants} onClick={() => onEdit(ep)} className="w-9 h-9 flex items-center justify-center rounded-full bg-green-500 text-white"><Icons.Edit size={16} /></motion.button>
                    <motion.button variants={itemVariants} onClick={() => setIsConfirming(true)} className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 text-white"><Icons.Trash size={16} /></motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.button 
              key="more-vertical"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setShowActions(true)} 
              className="w-9 h-9 flex items-center justify-center text-[var(--text-muted)]"
            >
              <Icons.MoreVertical size={16} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const AddEpisodes: React.FC = () => {
  const { hanimeDraft, setHanimeDraft, state } = useApp();
  const navigate = useNavigate();
  
  const [isAddingEpisode, setIsAddingEpisode] = useState(false);
  const [newEpisodeUrl, setNewEpisodeUrl] = useState('');
  const [newEpisodeCover, setNewEpisodeCover] = useState('');
  const [episodeStep, setEpisodeStep] = useState<'url' | 'cover'>('url');

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);
  };

  if (!hanimeDraft) {
    navigate('/manage-hanime');
    return null;
  }

  const episodes = hanimeDraft.episodes || [];

  const handleSave = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    const trigger = () => handleSave();
    window.addEventListener('vault-save-trigger', trigger);
    return () => window.removeEventListener('vault-save-trigger', trigger);
  }, [handleSave]);

  const addEpisode = () => {
    if (episodeStep === 'url') {
      if (isImageUrl(newEpisodeUrl)) {
        alert("Episode URL cannot be an image URL!");
        return;
      }
      setEpisodeStep('cover');
    } else {
      if (!isImageUrl(newEpisodeCover)) {
        alert("Episode Cover URL must be a valid image URL!");
        return;
      }
      if (episodes.some(ep => ep.url === newEpisodeUrl)) {
        alert("Episode with this URL already exists!");
        return;
      }
      const newEpisodes = [...episodes, { id: Math.random().toString(36).substr(2, 9), url: newEpisodeUrl, coverImage: newEpisodeCover, episodeNumber: episodes.length + 1 }];
      setHanimeDraft({
        ...hanimeDraft,
        episodes: newEpisodes
      });
      setNewEpisodeUrl('');
      setNewEpisodeCover('');
      setEpisodeStep('url');
      setIsAddingEpisode(false);
    }
  };

  const handleDelete = (id: string) => {
    const newEpisodes = episodes.filter(e => e.id !== id);
    // Re-number episodes
    const renumbered = newEpisodes.map((ep, idx) => ({ ...ep, episodeNumber: idx + 1 }));
    setHanimeDraft({
      ...hanimeDraft,
      episodes: renumbered
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-xl mx-auto p-4 pb-48 flex flex-col gap-y-8"
    >
      <div className="flex flex-col gap-y-6">
        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] mb-2 block">Episodes ({episodes.length})</label>
        <div className="flex flex-col gap-y-3">
          {episodes.map((ep) => (
            <EpisodeItem 
              key={ep.id} 
              ep={ep} 
              onEdit={(ep) => navigate(`/edit-episode/${hanimeDraft.id || 'new'}/${ep.id}`)} 
              onDelete={handleDelete}
            />
          ))}
        </div>
        {isAddingEpisode ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 w-full h-12"
          >
            <div className="flex-1 h-12 px-4 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2">
              <button 
                type="button" 
                onClick={async () => {
                  const text = await navigator.clipboard.readText();
                  if (episodeStep === 'url') setNewEpisodeUrl(text);
                  else setNewEpisodeCover(text);
                }}
                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                <Icons.Paste size={16} />
              </button>
              {episodeStep === 'url' ? (
                <input type="text" value={newEpisodeUrl} onChange={(e) => setNewEpisodeUrl(e.target.value)} placeholder="Episode URL" className="w-full bg-transparent outline-none text-sm" autoFocus />
              ) : (
                <input type="text" value={newEpisodeCover} onChange={(e) => setNewEpisodeCover(e.target.value)} placeholder="Episode Cover URL" className="w-full bg-transparent outline-none text-sm" autoFocus />
              )}
            </div>
            <button onClick={addEpisode} className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0" style={{ backgroundColor: state.settings.buttonColor }}>
              <Icons.Check />
            </button>
            <button onClick={() => { setIsAddingEpisode(false); setEpisodeStep('url'); }} className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 text-white border border-red-700 active:scale-90 transition-all shrink-0">
              <Icons.X size={16} />
            </button>
          </motion.div>
        ) : (
          <button onClick={() => setIsAddingEpisode(true)} className="w-full h-12 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] font-bold">Add episode</button>
        )}
      </div>
    </motion.div>
  );
};
