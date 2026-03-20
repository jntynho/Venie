
import { AppState, LinkItem, Actor, Tag, Coomer, CoomerPost, AppSettings, SortOrder, CropData, JapanLinkItem, HanimeItem, HanimeEpisode } from './types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import * as storage from './utils/storage';

export type SettingsView = 'main' | 'theme' | 'display' | 'interaction' | 'data' | 'header' | 'cover';

interface FormDraft {
  id: string | null; 
  title: string;
  urlHD: string;
  url4K: string;
  coverImage: string;
  coverOffset: number;
  aspectRatio: '16:9' | '3:2';
  actorIds: string[];
  tagIds: string[];
  galleryUrls: string[];
  assignedDate?: number;
}

interface ActorDraft {
  id: string | null;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
  crop?: CropData;
}

interface TagDraft {
  id: string | null;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
  crop?: CropData;
}

interface CoomerDraft {
  id: string | null;
  name: string;
  imageUrl: string;
  originalImageUrl: string;
  crop?: CropData;
  instagramPosts?: CoomerPost[];
  onlyFansPosts?: CoomerPost[];
  instagramLinks?: string[];
  onlyFansLinks?: string[];
}

interface HanimeDraft {
  id: string | null;
  title: string;
  coverImage: string;
  coverOffset: number;
  secondaryCovers: string[];
  description: string;
  assignedDate?: number;
  censorship?: 'UNCENSORED' | 'CENSORED';
  episodes: HanimeEpisode[];
}

interface AppContextType {
  state: AppState;
  addLink: (link: Omit<LinkItem, 'id' | 'isDeleted'>) => void;
  updateLink: (id: string, updates: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  deleteJapanLink: (id: string) => void;
  restoreLink: (id: string) => void;
  permDeleteLink: (id: string) => void;
  clearAllTrash: () => void;
  addActor: (actor: Omit<Actor, 'id' | 'isDeleted'>) => string;
  updateActor: (id: string, updates: Partial<Actor>) => void;
  deleteActor: (id: string) => void;
  restoreActor: (id: string) => void;
  permDeleteActor: (id: string) => void;
  addCoomer: (coomer: Omit<Coomer, 'id' | 'isDeleted'>) => string;
  updateCoomer: (id: string, updates: Partial<Coomer>) => void;
  deleteCoomer: (id: string) => void;
  restoreCoomer: (id: string) => void;
  permDeleteCoomer: (id: string) => void;
  addTag: (tag: Omit<Tag, 'id' | 'isDeleted'>) => string;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  restoreTag: (id: string) => void;
  permDeleteTag: (id: string) => void;
  addHanime: (hanime: Omit<HanimeItem, 'id' | 'isDeleted'>) => string;
  updateHanime: (id: string, updates: Partial<HanimeItem>) => void;
  deleteHanime: (id: string) => void;
  restoreHanime: (id: string) => void;
  permDeleteHanime: (id: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleSort: () => void;
  importData: (data: string) => boolean;
  runSystemCheck: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  settingsView: SettingsView;
  setSettingsView: (view: SettingsView) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  formDraft: FormDraft | null;
  setFormDraft: (draft: FormDraft | null) => void;
  hanimeDraft: HanimeDraft | null;
  setHanimeDraft: (draft: HanimeDraft | null) => void;
  actorDraft: ActorDraft | null;
  setActorDraft: (draft: ActorDraft | null) => void;
  tagDraft: TagDraft | null;
  setTagDraft: (draft: TagDraft | null) => void;
  coomerDraft: CoomerDraft | null;
  setCoomerDraft: (draft: CoomerDraft | null) => void;
  coomerActiveTab: 'Instagram' | 'OnlyFans';
  setCoomerActiveTab: (tab: 'Instagram' | 'OnlyFans') => void;
  pageRegistry: Record<string, number>;
  setPageRegistry: (registry: Record<string, number>) => void;
  isHydrated: boolean;
  hydrationError: string | null;
  actorMap: Map<string, Actor>;
  tagMap: Map<string, Tag>;
  actorUsageMap: Record<string, number>;
  tagUsageMap: Record<string, number>;
  actorTagAffinityMap: Record<string, Record<string, number>>;
  notifications: { id: string; message: string; type: 'success' | 'error' }[];
  addNotification: (message: string, type: 'success' | 'error') => void;
  removeNotification: (id: string) => void;
}

const STORAGE_KEY = 'linkvault_state_v18_final';

const defaultSettings: AppSettings = {
  theme: 'Dark',
  accentColor: '#3b82f6',
  actorNameColor: '#3b82f6',
  circleBorderColor: '#ffffff',
  titleSize: 'Medium',
  metadataSize: 'Small',
  cardStyle: 'FullWidth',
  managementView: 'Card',
  showActors: true,
  showTags: true,
  showActorCheckmark: true,
  enableGalleryPreview: true,
  sortOrder: 'Newest',
  itemsPerPage: 20,
  blurIntensity: 30,
  blurCovers: false,
  buttonStyle: 'Glass',
  buttonColor: '#3b82f6',
  galleryBgColor: '#1a1a1acc',
  headerOpacity: 100,
  headerTheme: 'Default',
};

const initialState: AppState = {
  links: [],
  trashLinks: [],
  japanLinks: [],
  hanime: [],
  actors: [],
  coomers: [],
  tags: [],
  settings: defaultSettings,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsView, setSettingsView] = useState<SettingsView>('main');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formDraft, setFormDraft] = useState<FormDraft | null>(null);
  const [hanimeDraft, setHanimeDraft] = useState<HanimeDraft | null>(null);
  const [actorDraft, setActorDraft] = useState<ActorDraft | null>(null);
  const [tagDraft, setTagDraft] = useState<TagDraft | null>(null);
  const [coomerDraft, setCoomerDraft] = useState<CoomerDraft | null>(null);
  const [coomerActiveTab, setCoomerActiveTab] = useState<'Instagram' | 'OnlyFans'>('Instagram');
  const [pageRegistry, setPageRegistry] = useState<Record<string, number>>({});
  const [scrollRegistry, setScrollRegistry] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: 'success' | 'error' }[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeNotification(id), 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const actorMap = useMemo(() => new Map(state.actors.map(a => [a.id, a])), [state.actors]);
  const tagMap = useMemo(() => new Map(state.tags.map(t => [t.id, t])), [state.tags]);

  const actorUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.links.forEach(l => l.actorIds.forEach(aid => map[aid] = (map[aid] || 0) + 1));
    return map;
  }, [state.links]);

  const tagUsageMap = useMemo(() => {
    const map: Record<string, number> = {};
    state.links.forEach(l => l.tagIds.forEach(tid => map[tid] = (map[tid] || 0) + 1));
    return map;
  }, [state.links]);

  const actorTagAffinityMap = useMemo(() => {
    const affinity: Record<string, Record<string, number>> = {};
    state.links.forEach(link => {
      link.actorIds.forEach(actorId => {
        if (!affinity[actorId]) affinity[actorId] = {};
        link.tagIds.forEach(tagId => {
          affinity[actorId][tagId] = (affinity[actorId][tagId] || 0) + 1;
        });
      });
    });
    return affinity;
  }, [state.links]);

  // Initial load from IndexedDB with migration fallback from localStorage
  useEffect(() => {
    const hydrate = async () => {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          setState({
            ...initialState,
            ...saved,
            settings: { ...defaultSettings, ...(saved.settings || {}) }
          });
        } else {
          // Fallback to localStorage migration for legacy users
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy) {
            const parsed = JSON.parse(legacy);
            const migratedState = {
              ...initialState,
              ...parsed,
              settings: { ...defaultSettings, ...(parsed.settings || {}) }
            };
            setState(migratedState);
            await storage.setItem(STORAGE_KEY, migratedState);
            // Optional: clean up localStorage after successful migration
            // localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error("Hydration failed", e);
        setHydrationError(e instanceof Error ? e.message : 'Unknown hydration error');
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, []);

  // Persist state to IndexedDB on changes
  useEffect(() => {
    if (!isHydrated) return;
    const handler = setTimeout(async () => {
      try {
        await storage.setItem(STORAGE_KEY, state);
      } catch (e) {
        console.error("Save to IndexedDB failed", e);
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [state, isHydrated]);

  const addLink = (link: Omit<LinkItem, 'id' | 'isDeleted'>) => {
    const newLink: LinkItem = {
      ...link,
      id: Math.random().toString(36).substr(2, 9),
      isDeleted: false,
      createdAt: Date.now(),
    };
    setState(prev => ({ ...prev, links: [newLink, ...prev.links] }));
  };

  const updateLink = (id: string, updates: Partial<LinkItem>) => {
    setState(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, ...updates } : l),
      trashLinks: prev.trashLinks.map(l => l.id === id ? { ...l, ...updates } : l),
    }));
  };

  const deleteLink = (id: string) => {
    setState(prev => {
      const item = prev.links.find(l => l.id === id);
      if (!item) return prev;
      return {
        ...prev,
        links: prev.links.filter(l => l.id !== id),
        trashLinks: [{ ...item, isDeleted: true, deletedAt: Date.now() }, ...prev.trashLinks],
      };
    });
  };

  const deleteJapanLink = (id: string) => {
    setState(prev => ({
      ...prev,
      japanLinks: prev.japanLinks.filter(l => l.id !== id)
    }));
  };

  const restoreLink = (id: string) => {
    setState(prev => {
      const item = prev.trashLinks.find(l => l.id === id);
      if (!item) return prev;
      return {
        ...prev,
        trashLinks: prev.trashLinks.filter(l => l.id !== id),
        links: [{ ...item, isDeleted: false, deletedAt: undefined }, ...prev.links],
      };
    });
  };

  const permDeleteLink = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      trashLinks: prev.trashLinks.filter(l => l.id !== id),
      links: prev.links.filter(l => l.id !== id),
    }));
  };

  const clearAllTrash = useCallback(() => {
    setState(prev => ({ ...prev, trashLinks: [] }));
  }, []);

  const addActor = (actor: Omit<Actor, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      actors: [...prev.actors, { ...actor, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateActor = (id: string, updates: Partial<Actor>) => {
    setState(prev => ({
      ...prev,
      actors: prev.actors.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const deleteActor = (id: string) => {
    setState(prev => ({
      ...prev,
      actors: prev.actors.map(a => a.id === id ? { ...a, isDeleted: true } : a),
    }));
  };

  const restoreActor = (id: string) => {
    setState(prev => ({
      ...prev,
      actors: prev.actors.map(a => a.id === id ? { ...a, isDeleted: false } : a)
    }));
  };

  const permDeleteActor = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      actors: prev.actors.filter(a => a.id !== id),
      links: prev.links.map(l => ({ ...l, actorIds: l.actorIds.filter(aid => aid !== id) })),
    }));
  };

  const addCoomer = (coomer: Omit<Coomer, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      coomers: [...prev.coomers, { ...coomer, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateCoomer = (id: string, updates: Partial<Coomer>) => {
    setState(prev => ({
      ...prev,
      coomers: prev.coomers.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCoomer = (id: string) => {
    setState(prev => ({
      ...prev,
      coomers: prev.coomers.map(c => c.id === id ? { ...c, isDeleted: true } : c),
    }));
  };

  const restoreCoomer = (id: string) => {
    setState(prev => ({
      ...prev,
      coomers: prev.coomers.map(c => c.id === id ? { ...c, isDeleted: false } : c)
    }));
  };

  const permDeleteCoomer = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      coomers: prev.coomers.filter(c => c.id !== id),
    }));
  };

  const addTag = (tag: Omit<Tag, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      tags: [...prev.tags, { ...tag, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateTag = (id: string, updates: Partial<Tag>) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteTag = (id: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === id ? { ...t, isDeleted: true } : t)
    }));
  };

  const restoreTag = (id: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.map(t => t.id === id ? { ...t, isDeleted: false } : t)
    }));
  };

  const permDeleteTag = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(t => t.id !== id),
      links: prev.links.map(l => ({ ...l, tagIds: l.tagIds.filter(tid => tid !== id) })),
    }));
  };

  const addHanime = (hanime: Omit<HanimeItem, 'id' | 'isDeleted'>): string => {
    const id = Math.random().toString(36).substr(2, 9);
    setState(prev => ({
      ...prev,
      hanime: [...prev.hanime, { ...hanime, id, isDeleted: false, createdAt: Date.now() }]
    }));
    return id;
  };

  const updateHanime = (id: string, updates: Partial<HanimeItem>) => {
    setState(prev => ({
      ...prev,
      hanime: prev.hanime.map(h => h.id === id ? { ...h, ...updates } : h)
    }));
  };

  const deleteHanime = (id: string) => {
    setState(prev => ({
      ...prev,
      hanime: prev.hanime.map(h => h.id === id ? { ...h, isDeleted: true } : h),
    }));
  };

  const restoreHanime = (id: string) => {
    setState(prev => ({
      ...prev,
      hanime: prev.hanime.map(h => h.id === id ? { ...h, isDeleted: false } : h)
    }));
  };

  const permDeleteHanime = (id: string) => {
    setState(prev => ({ 
      ...prev, 
      hanime: prev.hanime.filter(h => h.id !== id),
    }));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  };

  const toggleSort = () => {
    const orders: SortOrder[] = ['Newest', 'Oldest', 'DateDesc', 'DateAsc'];
    const currentIndex = orders.indexOf(state.settings.sortOrder);
    const nextIndex = (currentIndex + 1) % orders.length;
    updateSettings({ sortOrder: orders[nextIndex] });
  };

  const runSystemCheck = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setState(prev => {
      const missavTag = prev.tags.find(t => t.name.toUpperCase() === 'MISSAV' && !t.isDeleted);
      const codeRegex = /[A-Z0-9]{2,10}-\d{2,10}/i;
      
      const updateLinkSet = (linkSet: any[]) => linkSet.map(link => {
        const target = link.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const currentActorIds = new Set(link.actorIds);
        const currentTagIds = new Set(link.tagIds || []);
        
        prev.actors.forEach(actor => {
          if (actor.isDeleted) return;
          const cleanActor = actor.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanActor.length > 2 && target.includes(cleanActor)) currentActorIds.add(actor.id);
        });

        prev.tags.forEach(tag => {
          if (tag.isDeleted) return;
          const cleanTag = tag.name.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (cleanTag.length > 1 && target.includes(cleanTag)) currentTagIds.add(tag.id);
        });

        if (missavTag && codeRegex.test(link.title)) currentTagIds.add(missavTag.id);

        return {
          ...link,
          actorIds: Array.from(currentActorIds),
          tagIds: Array.from(currentTagIds)
        };
      });

      return { 
        ...prev, 
        links: updateLinkSet(prev.links), 
        trashLinks: updateLinkSet(prev.trashLinks),
      };
    });
  }, []);

  const importData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data && typeof data === 'object') {
        const newState: AppState = {
          links: Array.isArray(data.links) ? data.links : [],
          trashLinks: Array.isArray(data.trashLinks) ? data.trashLinks : [],
          japanLinks: Array.isArray(data.japanLinks) ? data.japanLinks : [],
          hanime: Array.isArray(data.hanime) ? data.hanime : [],
          actors: Array.isArray(data.actors) ? data.actors : [],
          coomers: Array.isArray(data.coomers) ? data.coomers : [],
          tags: Array.isArray(data.tags) ? data.tags : [],
          settings: { ...defaultSettings, ...(data.settings || {}) }
        };
        setState(newState);
        addNotification("Data imported successfully.", "success");
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import failed", e);
      addNotification("Failed to parse import data.", "error");
      return false;
    }
  };

  const contextValue = useMemo(() => ({
    state, addLink, updateLink, deleteLink, deleteJapanLink, restoreLink, permDeleteLink,
    clearAllTrash,
    addActor, updateActor, deleteActor, restoreActor, permDeleteActor,
    addCoomer, updateCoomer, deleteCoomer, restoreCoomer, permDeleteCoomer,
    addTag, updateTag, deleteTag, restoreTag, permDeleteTag,
    addHanime, updateHanime, deleteHanime, restoreHanime, permDeleteHanime,
    updateSettings, toggleSort, importData, runSystemCheck, searchQuery, setSearchQuery,
    settingsView, setSettingsView,
    isMenuOpen, setIsMenuOpen,
    formDraft, setFormDraft,
    hanimeDraft, setHanimeDraft,
    actorDraft, setActorDraft,
    tagDraft, setTagDraft,
    coomerDraft, setCoomerDraft,
    coomerActiveTab, setCoomerActiveTab,
    pageRegistry, setPageRegistry,
    isHydrated,
    hydrationError,
    actorMap,
    tagMap,
    actorUsageMap,
    tagUsageMap,
    actorTagAffinityMap,
    notifications, addNotification, removeNotification,
  }), [
    state, searchQuery, settingsView, isMenuOpen, formDraft, hanimeDraft, actorDraft, tagDraft, coomerDraft, 
    coomerActiveTab, pageRegistry, isHydrated, hydrationError, actorMap, tagMap, actorUsageMap, tagUsageMap, actorTagAffinityMap, clearAllTrash, runSystemCheck, notifications,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
