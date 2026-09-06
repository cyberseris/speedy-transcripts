"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadForm() {
  const router = useRouter();
  const [videoSourceUrl, setVideoSourceUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("zh");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_source_url: videoSourceUrl,
          topic: topic || null,
          language,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        job_id?: string;
      };

      if (!res.ok) {
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }

      setVideoSourceUrl("");
      setTopic("");
      // Re-run the Server Component so the new job shows up in the list above.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video_source_url">Video URL</Label>
        <Input
          id="video_source_url"
          type="url"
          required
          placeholder="Direct mp4 / mp3 URL (e.g. CloudFront, Vimeo, Internet Archive)"
          value={videoSourceUrl}
          onChange={(e) => setVideoSourceUrl(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          YouTube links are not supported — YouTube blocks downloads from cloud IPs.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="topic">Topic (optional)</Label>
        <Input
          id="topic"
          type="text"
          placeholder="e.g. Tech podcast — useful context for the model"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">Language</Label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <option value="zh">中文 (zh)</option>
          <option value="en">English (en)</option>
          <option value="ja">日本語 (ja)</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full rounded-full" disabled={loading}>
        {loading ? "Submitting…" : "Transcribe"}
      </Button>
    </form>
  );
}
