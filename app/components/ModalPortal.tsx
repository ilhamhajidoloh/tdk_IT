"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: ReactNode;
}

/**
 * ModalPortal teleports modal dialogs directly into document.body
 * to completely eliminate CSS containing block trapping caused by:
 * - transform (animations like animate-fade-in-up)
 * - filter, perspective, backdrop-filter
 * - overflow: hidden on parent containers
 *
 * This guarantees the modal backdrop will always cover 100% of the viewport (full screen).
 */
export default function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

