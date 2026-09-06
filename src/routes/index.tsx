import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Timer, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Video Speed Reader — Transcripts in three minutes" },
      {
        name: "description",
        content:
          "Upload your video and get an accurate Chinese or English transcript in three minutes. Built for creators, educators, and engineers.",
      },
      { property: "og:title", content: "Video Speed Reader — Transcripts in three minutes" },
      {
        property: "og:description",
        content:
          "Upload your video, get a clean transcript in three minutes. High-accuracy, commercial-use ready.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Sparkles,
    title: "高準確度逐字稿",
    subtitle: "High-accuracy transcripts",
    body: "Powered by OpenAI Whisper, with solid support for both Chinese and English audio.",
  },
  {
    icon: Timer,
    title: "三分鐘交付",
    subtitle: "Three-minute turnaround",
    body: "Your video is processed in the background — we email you the moment it's ready.",
  },
  {
    icon: ShieldCheck,
    title: "可商用授權",
    subtitle: "Commercial-use ready",
    body: "You own the output. Publish it, sell it, or archive it however you like.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="text-base font-semibold tracking-tight">Video Speed Reader</span>
          <Button asChild size="sm">
            <Link to="/signin">Sign in / 登入</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="hero-glow">
          <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
            <Reveal>
              <span className="inline-flex items-center rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
                Whisper-powered transcription
              </span>
              <h1 className="text-gradient mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
                Video Speed Reader
              </h1>
              <p className="mt-6 text-xl font-medium sm:text-2xl">
                上傳影片，三分鐘內拿到逐字稿。
              </p>
              <p className="mt-3 text-base text-muted-foreground">
                Upload your video, get a clean transcript in three minutes.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="shadow-[var(--shadow-glow)]">
                  <Link to="/signup">Get started free</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/signin">Sign in / 登入</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-28">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <article className="h-full rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold">{f.title}</h2>
                  <p className="text-sm text-primary">{f.subtitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted-foreground">
          © 2026 Video Speed Reader
        </div>
      </footer>
    </div>
  );
}
