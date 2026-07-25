import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';

interface Props {
  text: string | null;
}

export const VoiceToast: React.FC<Props> = ({ text }) => (
  <AnimatePresence>
    {text && (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl shadow-blue-600/10 max-w-xs w-full"
      >
        <div className="w-8 h-8 bg-blue-600/30 rounded-full flex items-center justify-center flex-shrink-0">
          <Volume2 className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-[10px] text-white font-medium flex-1">{text}</p>
      </motion.div>
    )}
  </AnimatePresence>
);
