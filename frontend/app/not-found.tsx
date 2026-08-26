import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <h2 className="text-2xl font-bold font-mono text-slate-900 dark:text-white">Page Not Found</h2>
      <p className="text-sm text-slate-500 font-mono">The requested diagnostic route does not exist.</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs rounded-lg font-bold transition-all"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
