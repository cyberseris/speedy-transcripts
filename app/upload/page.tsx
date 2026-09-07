import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { JobsTable, type JobRow } from "@/views/JobsTable";
import { UploadForm } from "@/views/UploadForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Transcriptions — Video Speed Reader",
  description: "Submit a video URL and get a transcript back.",
};

// Job rows change as the worker advances them, so never serve a cached page.
export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Two queries on purpose, no embedded select.
  //
  // `jobs` and `job_sessions` are joined by TWO foreign keys -- job_sessions.job_id
  // -> jobs.id, and jobs.current_session_id -> job_sessions.id. PostgREST cannot
  // pick one on its own, so `job_sessions(...)` embedded in this select fails with
  // an ambiguous-relationship error and returns no rows at all.
  //
  // RLS already scopes these to the caller; the explicit filter documents intent.
  const { data: jobRows, error: jobsError } = await supabase
    .from("jobs")
    .select("id, created_at, video_source_url, status, current_session_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Never swallow this again: an empty list should be an empty list, not a
  // failed query wearing one as a disguise.
  if (jobsError) console.error("jobs query failed", jobsError);

  type RawJob = {
    id: string;
    created_at: string;
    video_source_url: string;
    status: string;
    current_session_id: string | null;
  };

  const rawJobs = (jobRows ?? []) as RawJob[];

  // Which of those sessions already have a cached summary. The text itself
  // stays out of the list payload.
  const sessionIds = rawJobs
    .map((job) => job.current_session_id)
    .filter((id): id is string => Boolean(id));

  const summarised = new Set<string>();
  if (sessionIds.length > 0) {
    const { data: sessionRows, error: sessionsError } = await supabase
      .from("job_sessions")
      .select("id, summary_text")
      .in("id", sessionIds);

    if (sessionsError) console.error("job_sessions query failed", sessionsError);

    for (const row of (sessionRows ?? []) as { id: string; summary_text: string | null }[]) {
      if (row.summary_text) summarised.add(row.id);
    }
  }

  const jobs: JobRow[] = rawJobs.map((job) => ({
    id: job.id,
    created_at: job.created_at,
    video_source_url: job.video_source_url,
    status: job.status,
    has_summary: Boolean(job.current_session_id && summarised.has(job.current_session_id)),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader current="/upload" />

      <main className="hero-glow flex-1">
        <div className="mx-auto max-w-5xl space-y-8 px-5 py-14">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Transcriptions</h1>
            <p className="mt-2 text-muted-foreground">Signed in as {user.email}</p>
          </div>

          <section className="blob-card border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-display mb-4 text-lg font-semibold tracking-tight">Recent jobs</h2>
            <JobsTable jobs={jobs} />
          </section>

          <section className="blob-card max-w-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-display mb-4 text-xl font-semibold tracking-tight">
              New transcription
            </h2>
            <UploadForm />
          </section>
        </div>
      </main>
    </div>
  );
}
