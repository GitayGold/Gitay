'use client';

import { motion } from 'framer-motion';

/**
 * Thin client wrapper that adds a single subtle entrance animation
 * to the dashboard content. Server-rendered children stream into it
 * without becoming client components themselves.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
