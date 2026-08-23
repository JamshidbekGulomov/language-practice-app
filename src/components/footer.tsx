import Link from "next/link";
import { Send } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { MODULES } from "@/lib/modules";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div>
          <p className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
            {siteConfig.name}
          </p>
          <p className="mt-1 max-w-xs text-sm text-slate-500">
            Practice listening, reading, vocabulary, writing, speaking, and
            translation in one place.
          </p>
          <a
            href={siteConfig.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            <Send className="h-4 w-4" />
            Join our Telegram channel
          </a>
        </div>

        <nav className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3">
          {MODULES.map((m) => (
            <Link
              key={m.slug}
              href={`/${m.slug}`}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {m.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
