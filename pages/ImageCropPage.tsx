
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ImageCropper } from '../components/ImageCropper';
import { CropData } from '../types';

export const ImageCropPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setActorDraft, actorDraft, setTagDraft, tagDraft, setCoomerDraft, coomerDraft } = useApp();

  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || 'actor';

  const [currentCrop, setCurrentCrop] = useState<CropData | null>(null);

  // Determine source image and initial crop from global draft
  const draft = type === 'actor' ? actorDraft : (type === 'tag' ? tagDraft : coomerDraft);
  const image = draft?.originalImageUrl || draft?.imageUrl || '';
  const initialCrop = draft?.crop;

  const handleSave = useCallback(() => {
    if (currentCrop) {
      if (type === 'actor' && actorDraft) {
        setActorDraft({ ...actorDraft, crop: currentCrop });
      } else if (type === 'tag' && tagDraft) {
        setTagDraft({ ...tagDraft, crop: currentCrop });
      } else if (type === 'coomer' && coomerDraft) {
        setCoomerDraft({ ...coomerDraft, crop: currentCrop });
      }
    }
    // Navigate back to the previous screen (the Add/Edit page)
    navigate(-1);
  }, [currentCrop, type, actorDraft, tagDraft, setActorDraft, setTagDraft, navigate]);

  useEffect(() => {
    window.addEventListener('vault-save-trigger', handleSave);
    return () => window.removeEventListener('vault-save-trigger', handleSave);
  }, [handleSave]);

  if (!image) {
    useEffect(() => {
      navigate(-1);
    }, [navigate]);
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col bg-[var(--bg)] animate-slide-in contain-layout overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <ImageCropper 
          image={image}
          initialCrop={initialCrop ? { x: initialCrop.x, y: initialCrop.y } : undefined}
          initialZoom={initialCrop?.zoom}
          onCropUpdate={setCurrentCrop}
        />
      </div>
    </div>
  );
};
