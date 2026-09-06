/** @type {import('next').NextConfig} */
const nextConfig = {
  // M0's Vite build never gated on types. Preserve that so the course keeps
  // shipping fast; type errors still surface in the editor.
  //
  // NOTE: the skill's template also sets `eslint: { ignoreDuringBuilds: true }`.
  // Next.js 16 removed `next lint` and rejects that key as an unrecognized
  // option, so it is omitted here -- lint no longer runs during build anyway.
  typescript: { ignoreBuildErrors: true },

  // M0 shipped /signin and /signup. M1 renames them to /sign-in and /sign-up;
  // these keep old links (and any stale Supabase redirect URLs) working.
  async redirects() {
    return [
      { source: "/signin", destination: "/sign-in", permanent: true },
      { source: "/signup", destination: "/sign-up", permanent: true },
    ];
  },
};

export default nextConfig;
