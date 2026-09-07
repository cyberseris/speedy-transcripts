"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Sparkles, X } from "lucide-react";

export type JobRow = {
  id: string;
  created_at: string;
  video_source_url: string;
  status: string;
  has_summary: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  downloading: "bg-muted text-muted-foreground",
  transcribe: "bg-teal/25 text-teal-foreground",
  done: "bg-primary/15 text-primary",
  error: "bg-coral/20 text-coral-foreground",
  insufficient_credits: "bg-sun/40 text-foreground",
};

// Anything not in this set is terminal -- nothing left to poll for.
const ACTIVE = new Set(["pending", "downloading", "transcribe"]);

function relativeTime(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function truncate(value: string, max = 50): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function JobsTable({ jobs }: { jobs: JobRow[] }) {
  const router = useRouter();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll only while something is still moving. The server component re-renders
  // on refresh(), so pending -> downloading -> transcribe -> done shows up
  // without the user touching anything.
  const hasActive = jobs.some((job) => ACTIVE.has(job.status));
  useEffect(() => {
    if (!hasActive) return;
    const timer = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(timer);
  }, [hasActive, router]);

  // Esc closes the modal.
  useEffect(() => {
    if (!openFor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openFor]);

  async function showSummary(jobId: string) {
    setLoadingId(jobId);
    setError(null);
    setSummary(null);
    setOpenFor(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/summary`, { method: "POST" });
      const payload = (await res.json().catch(() => ({}))) as {
        summary?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(payload.error ?? `Request failed (${res.status})`);
      } else {
        setSummary(payload.summary ?? "");
        router.refresh();
      }
    } catch {
      setError("Could not reach the server — please try again.");
    } finally {
      setLoadingId(null);
    }
  }

  if (jobs.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No transcriptions yet. Submit your first video below.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <th className="pb-3 font-medium">Created</th>
              <th className="pb-3 font-medium">URL</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Transcript</th>
              <th className="pb-3 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 whitespace-nowrap text-muted-foreground">
                  {relativeTime(job.created_at)}
                </td>
                <td className="py-3 pr-4">
                  <span className="font-mono text-xs break-all">
                    {truncate(job.video_source_url)}
                  </span>
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[job.status] ?? "bg-muted text-muted-foreground"
                    }`}
                  >
                    {job.status}
                  </span>
                </td>
                <td className="py-3">
                  {job.status === "done" ? (
                    <a
                      href={`/api/jobs/${job.id}/transcript`}
                      download={`transcript-${job.id.slice(0, 8)}.txt`}
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Download className="size-3.5" />
                      .txt
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3">
                  {job.status !== "done" ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void showSummary(job.id)}
                      disabled={loadingId !== null}
                      className="inline-flex items-center gap-1.5 text-primary hover:underline disabled:opacity-50"
                    >
                      {job.has_summary ? (
                        <>
                          <FileText className="size-3.5" />
                          View
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          {loadingId === job.id ? "Summarizing…" : "Summarize"}
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openFor ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={() => setOpenFor(null)}
role="presentation"
        >
          <div
            className="blob-card max-h-[80vh] w-full max-w-2xl overflow-y-auto border border-border bg-card p-7 shadow-[var(--shadow-soft)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Summary"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">Summary</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cached after first generation — open again any time at no cost.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenFor(null)}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5">
              {loadingId === openFor ? (
                <p className="text-sm text-muted-foreground">Generating summary…</p>
              ) : error ? (
                <p className="rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
                  {error}
                </p>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary}</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
