/** "English" (gradient) + "with" (muted) + "Jamshidbek" (dark) — the site wordmark, split for styling. */
export function Brand({ className = "text-lg" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1 font-extrabold tracking-tight ${className}`}>
      <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
        English
      </span>
      <span className="text-sm font-normal text-slate-400">with</span>
      <span className="text-slate-900">Jamshidbek</span>
    </span>
  );
}
