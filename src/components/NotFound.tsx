import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="hero-glow flex min-h-screen items-center justify-center bg-background px-4">
      <div className="blob-card max-w-md border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
        <h1 className="font-display text-gradient text-7xl font-semibold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
