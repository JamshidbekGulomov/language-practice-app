"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize, Minimize } from "lucide-react";

/**
 * Wraps whichever embed (YouTube iframe or Telegram widget) in a
 * fullscreen-able container with our own toggle button — Telegram's
 * widget iframe doesn't expose native fullscreen since we don't control
 * its attributes, so a container-level toggle works for both uniformly.
 */
export function VideoContainer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  function toggleFullscreen() {
    const el = ref.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  }

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-lg border border-slate-200 [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:justify-center [&:fullscreen]:border-0 [&:fullscreen]:bg-black"
    >
      {children}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Watch fullscreen"}
        className="absolute bottom-2 right-2 rounded-lg bg-black/60 p-2 text-white hover:bg-black/80"
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
      </button>
    </div>
  );
}
