import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

// Ported from M0's index.html <head> — same title, description, social tags and
// Google Fonts (Fredoka / Noto Sans TC / IBM Plex Mono) the M0 stylesheet expects.
export const metadata: Metadata = {
  title: "Video Speed Reader",
  description: "Upload your video, get a clean transcript in three minutes.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    title: "Video Speed Reader",
    description: "Upload your video, get a clean transcript in three minutes.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Noto+Sans+TC:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
