import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';

export const Notification: React.FC = () => {
  const { notifications, removeNotification } = useApp();

  return (
    <div className="fixed bottom-10 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`px-6 py-2.5 rounded-full shadow-2xl text-white text-[13px] font-bold tracking-tight text-center pointer-events-auto backdrop-blur-md border border-white/10 ${n.type === 'success' ? 'bg-emerald-600/90' : 'bg-rose-600/90'}`}
          >
            {n.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
