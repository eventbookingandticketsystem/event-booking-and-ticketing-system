"use client";

// Prevent Next.js from attempting a static prerender of /_global-error.
// Without this, Netlify's non-standard NODE_ENV causes Next.js 16 to try
// to prerender this page through the provider tree, hitting useContext on
// a null React object.
export const dynamic = "force-dynamic";

/**
 * global-error.tsx — root-level error boundary.
 *
 * Must be a self-contained 'use client' component with its own <html>/<body>
 * tags. Next.js renders this instead of the root layout when the root layout
 * itself (or a provider inside it) throws, so NO providers from layout.tsx
 * are available here.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#060F18",
          color: "#F1F5F9",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 12,
              background: "#F97316",
              marginBottom: 24,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <h1
            style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#94A3B8",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred. Our team has been notified.
            {error.digest && (
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  fontSize: 12,
                  color: "#64748B",
                }}
              >
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{
              background: "#F97316",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
