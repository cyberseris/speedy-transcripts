export function AppShell({ email }: { email: string }) {
  return (
    <main className="hero-glow flex-1">
      <div className="mx-auto max-w-5xl px-5 py-20">
        <div className="blob-card max-w-xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Hi {email}</h1>
          <p className="mt-4 text-muted-foreground">
            Submit a video on the Transcriptions page and the worker will take it from there.
          </p>
        </div>
      </div>
    </main>
  );
}
