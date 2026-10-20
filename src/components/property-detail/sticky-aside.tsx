"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

const NAV_CLEARANCE = 112;
const BOTTOM_GAP = 24;

/**
 * Sticks below the nav when it fits. When it is taller than the viewport it
 * rides the page until its last line is in view, then sticks there, so the
 * submit button is always reachable without a nested scroll area.
 */
export function StickyAside({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(NAV_CLEARANCE);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTop(Math.min(NAV_CLEARANCE, window.innerHeight - el.offsetHeight - BOTTOM_GAP));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} className="sticky" style={{ top }}>
      {children}
    </div>
  );
}
