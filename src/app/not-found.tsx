/**
 * not-found.tsx — app-wide 404 page.
 *
 * This is a server component intentionally — no hooks, no providers.
 * Next.js renders this when notFound() is thrown or a route is unmatched.
 * It renders inside the root layout (which supplies AuthProvider /
 * QueryProvider as client boundaries), so this file itself must stay
 * hook-free to avoid the "useState of null" prerender crash.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#060F18] px-6 text-center">
      <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-brand-orange">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="11" />
          <line x1="11" y1="14" x2="11.01" y2="14" />
        </svg>
      </span>

      <h1 className="font-display text-5xl font-bold text-white">404</h1>
      <p className="mt-2 font-display text-xl font-semibold text-white">
        Page not found
      </p>
      <p className="mt-3 max-w-xs font-body text-sm leading-relaxed text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-3 font-body text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#060F18]"
      >
        Back to home
      </Link>
    </main>
  );
}
