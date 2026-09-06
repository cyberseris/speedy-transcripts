import { Link } from "react-router-dom";
import { AudioLines, Mail, Mic, Sparkles, Timer, ShieldCheck, UploadCloud } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/PageMeta";

const steps = [
  {
    icon: UploadCloud,
    title: "上傳影片",
    subtitle: "Upload your video",
    body: "拖曳 MP4、MOV 或貼上連結，其他交給我們。",
    accent: "primary",
  },
  {
    icon: AudioLines,
    title: "AI 聽打逐字稿",
    subtitle: "Whisper transcribes",
    body: "Whisper 同時聽懂中文與英文，逐句寫下時間戳。",
    accent: "teal",
  },
  {
    icon: Mail,
    title: "三分鐘內送達",
    subtitle: "Delivered by email",
    body: "完成後立刻寄到你的信箱，複製或下載都行。",
    accent: "coral",
  },
] as const;

const features = [
  {
    icon: Sparkles,
    title: "高準確度逐字稿",
    subtitle: "High-accuracy transcripts",
    body: "Powered by OpenAI Whisper, with solid support for both Chinese and English audio.",
    accent: "primary",
  },
  {
    icon: Timer,
    title: "三分鐘交付",
    subtitle: "Three-minute turnaround",
    body: "Your video is processed in the background — we email you the moment it's ready.",
    accent: "teal",
  },
  {
    icon: ShieldCheck,
    title: "可商用授權",
    subtitle: "Commercial-use ready",
    body: "You own the output. Publish it, sell it, or archive it however you like.",
    accent: "coral",
  },
] as const;

const accentClasses = {
  primary: "bg-primary/12 text-primary",
  teal: "bg-teal/15 text-teal-foreground",
  coral: "bg-coral/15 text-coral-foreground",
} as const;

const waveHeights = [38, 72, 55, 90, 62, 40, 84, 58, 70, 46, 66, 34];

export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageMeta
        title="Video Speed Reader — Transcripts in three minutes"
        description="Upload your video and get an accurate Chinese or English transcript in three minutes. Built for creators, educators, and engineers."
        ogDescription="Upload your video, get a clean transcript in three minutes. High-accuracy, commercial-use ready."
      />
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Mic className="size-4.5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Video Speed Reader
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/signin">登入</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/signup">免費開始</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -left-20 size-72 rounded-full bg-sun/40 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute top-6 -right-24 size-80 rounded-full bg-teal/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/3 size-64 rounded-full bg-coral/25 blur-3xl"
          />

          <div className="hero-glow">
            <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:py-28 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
              <Reveal>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                  <Sparkles className="size-3.5 text-primary" />
                  Whisper 語音辨識驅動
                </span>
                <h1 className="font-display text-gradient mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
                  Video Speed Reader
                </h1>
                <p className="font-display mt-6 text-2xl font-medium sm:text-3xl">
                  上傳影片，三分鐘內拿到逐字稿。
                </p>
                <p className="mt-3 max-w-md text-base text-muted-foreground">
                  Upload your video, get a clean transcript in three minutes.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="rounded-full shadow-[var(--shadow-glow)]">
                    <Link to="/signup">免費開始 · Get started</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full">
                    <Link to="/signin">登入</Link>
                  </Button>
                </div>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span>✓ 中英雙語辨識</span>
                  <span>✓ 三分鐘交付</span>
                  <span>✓ 可商用授權</span>
                </div>
              </Reveal>

              <Reveal delay={150}>
                <div className="blob-card relative mx-auto w-full max-w-md border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/15 px-3 py-1 text-xs font-medium text-coral-foreground">
                      <span className="size-1.5 animate-pulse rounded-full bg-coral" />
                      處理中 Processing
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">02:58</span>
                  </div>

                  <div className="mt-6 flex h-16 items-end gap-1.5" aria-hidden>
                    {waveHeights.map((h, i) => (
                      <span
                        key={i}
                        className="animate-wave w-full origin-bottom rounded-full bg-gradient-to-t from-primary to-coral"
                        style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>

                  <div className="my-5 h-px bg-border" />

                  <div className="space-y-2.5 font-mono text-sm leading-relaxed">
                    <p>
                      <span className="text-primary">00:12</span>{" "}
                      <span className="text-muted-foreground">Hi everyone, welcome back —</span>
                    </p>
                    <p>
                      <span className="text-primary">00:16</span>{" "}
                      <span className="text-muted-foreground">今天我們來聊聊逐字稿工具</span>
                    </p>
                    <p>
                      <span className="text-primary">00:21</span> Let's get started
                      <span className="animate-caret text-primary">▍</span>
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal className="mx-auto max-w-xl text-center">
            <span className="text-sm font-medium text-teal-foreground">
              使用流程 · How it works
            </span>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight">
              三個步驟，拿到逐字稿
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 120}>
                <article
                  className={`${i % 2 === 0 ? "blob-card" : "blob-card-alt"} h-full border border-border bg-card p-6`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex size-11 items-center justify-center rounded-full ${accentClasses[s.accent]}`}
                    >
                      <s.icon className="size-5" />
                    </div>
                    <span className="font-display text-3xl font-semibold text-foreground/10">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                  <p className="text-sm text-primary">{s.subtitle}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-28">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 120}>
                <article
                  className={`${i % 2 === 0 ? "blob-card-alt" : "blob-card"} h-full border border-border bg-card p-6 transition-colors hover:border-primary/40`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-full ${accentClasses[f.accent]}`}
                  >
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

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
          <span className="font-display font-medium text-foreground">Video Speed Reader</span>
          <span>© 2026 Video Speed Reader</span>
        </div>
      </footer>
    </div>
  );
}
