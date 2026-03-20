
import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../AppContext';
import { LinkCard } from '../components/LinkCard';
import { SkeletonLinkCard } from '../components/SkeletonCard';
import { PaginationBar } from '../components/Pagination';
import { usePaginatedLinks } from '../hooks/usePaginatedLinks';

export const Home: React.FC = () => {
  const { state, searchQuery, isHydrated, hydrationError, actorMap, tagMap, deleteLink } = useApp();
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);

  const allLinks = useMemo(() => state.links.filter(l => !l.isDeleted), [state.links]);
  
  const {
    filteredLinks,
    paginatedLinks,
    currentPage,
    handlePageChange,
    isLoading,
    isSearching,
    itemsPerPage
  } = usePaginatedLinks(allLinks, searchQuery, actorMap, tagMap);

  const handleToggle = useCallback((id: string) => {
    setActiveLinkId(prev => prev === id ? null : id);
  }, []);

  const itemVariants = {
    hidden: { opacity: 0, x: -20, scale: 0.98 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: { 
        delay: i < 8 ? i * 0.05 : 0,
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1]
      }
    })
  };

  if (hydrationError) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-center px-6">
        <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.4em] mb-2">Hydration Error</h2>
        <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-medium">{hydrationError}</p>
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="flex flex-col w-full animate-pulse">
        {Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonLinkCard key={i} />)}
      </div>
    );
  }

  if (filteredLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-48 text-center px-6 animate-slide-in">
        <h2 className="text-sm font-black text-white/10 uppercase tracking-[0.4em] mb-2">Database Standby</h2>
        <p className="text-[10px] text-white/5 uppercase tracking-[0.2em] font-medium">No matches found in records</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gpu-accelerated w-full">
      {isLoading || isSearching ? (
        <div className="flex flex-col w-full animate-pulse">
          {Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonLinkCard key={i} />)}
        </div>
      ) : (
        paginatedLinks.map((link, index) => (
          <motion.div 
            key={link.id} 
            custom={index}
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1, margin: "0px 0px -50px 0px" }}
          >
            <LinkCard 
              link={link} 
              isExpanded={activeLinkId === link.id}
              onToggle={handleToggle}
              noSideMargins={true}
              deleteLink={deleteLink}
              actorMap={actorMap}
              tagMap={tagMap}
              settings={state.settings}
            />
          </motion.div>
        ))
      )}
      <PaginationBar 
        currentPage={currentPage}
        totalLinks={filteredLinks.length}
        itemsPerPage={state.settings.itemsPerPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
