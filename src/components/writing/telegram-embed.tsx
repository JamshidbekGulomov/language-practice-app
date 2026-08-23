"use client";

import { useEffect, useRef } from "react";

/**
 * Telegram doesn't render correctly from a plain iframe URL — its official
 * widget script replaces itself with an iframe sized to the post's actual
 * content. postPath is "channelname/123" (from a t.me/channelname/123 link).
 */
export function TelegramEmbed({ postPath }: { postPath: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-post", postPath);
    script.setAttribute("data-width", "100%");
    container.appendChild(script);
  }, [postPath]);

  return <div ref={containerRef} className="w-full" />;
}
