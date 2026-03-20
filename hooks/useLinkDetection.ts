import React, { useCallback } from 'react';
import { Tag, Actor } from '../types';

export const useLinkDetection = (
  actors: Actor[],
  tags: Tag[],
  setSelectedActorIds: React.Dispatch<React.SetStateAction<string[]>>,
  setSelectedTagIds: React.Dispatch<React.SetStateAction<string[]>>,
  setAspectRatio: React.Dispatch<React.SetStateAction<'16:9' | '3:2'>>
) => {
  const cleanString = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/\.(com|net|org|edu|gov|io|tv|me|info|biz)\b/gi, '') 
      .replace(/[^a-z0-9]/g, ''); 
  };

  const performIntelligentDetection = useCallback((inputText: string, currentTagIds: string[]) => {
    const target = cleanString(inputText);
    if (!target || target.length < 3) return;

    const codeRegex = /[A-Z0-9]{2,10}-\d{2,10}/i;
    if (codeRegex.test(inputText)) {
      setAspectRatio('3:2');
      const missavTag = tags.find(t => t.name.toUpperCase() === 'MISSAV' && !t.isDeleted);
      if (missavTag && currentTagIds.length === 0) {
        setSelectedTagIds([missavTag.id]);
      }
    }

    const newActorIds: string[] = [];
    actors.forEach(actor => {
      if (actor.isDeleted) return;
      const cleanActor = cleanString(actor.name);
      if (cleanActor.length > 2 && target.includes(cleanActor)) {
        newActorIds.push(actor.id);
      }
    });

    const matchingTags: Tag[] = [];
    tags.forEach(tag => {
      if (tag.isDeleted) return;
      const cleanTag = cleanString(tag.name);
      if (cleanTag.length > 1 && target.includes(cleanTag)) {
        matchingTags.push(tag);
      }
    });

    const finalTagIds: string[] = [];
    matchingTags.forEach(tag => {
      const isShadowed = matchingTags.some(other => 
        other.id !== tag.id && 
        other.name.toLowerCase().includes(tag.name.toLowerCase()) &&
        other.name.length > tag.name.length
      );
      if (!isShadowed) {
        finalTagIds.push(tag.id);
      }
    });

    if (newActorIds.length > 0) {
      setSelectedActorIds(prev => Array.from(new Set([...prev, ...newActorIds])));
    }
    
    if (finalTagIds.length > 0 && currentTagIds.length === 0) {
      setSelectedTagIds([finalTagIds[0]]);
    }
  }, [actors, tags, setSelectedActorIds, setSelectedTagIds, setAspectRatio]);

  return { performIntelligentDetection };
};
