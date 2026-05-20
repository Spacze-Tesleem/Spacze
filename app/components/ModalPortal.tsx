'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into document.body via a React portal.
 *
 * This is necessary in the admin dashboard because the panel content is
 * wrapped in a framer-motion div that animates `filter: blur(...)`. A CSS
 * filter on any ancestor creates a new stacking context, which traps fixed-
 * position descendants inside it — making z-index irrelevant. Portalling to
 * body escapes that stacking context entirely.
 */
export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
