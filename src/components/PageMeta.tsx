// React 19 hoists <title>/<meta>/<link> tags rendered anywhere in the tree
// into <head>, so per-route metadata no longer needs a router-level `head()`
// config or a helmet-style library — this is a thin, typed convenience
// wrapper around that behavior.
export function PageMeta({
  title,
  description,
  ogTitle,
  ogDescription,
}: {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
}) {
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={ogTitle ?? title} />
      <meta property="og:description" content={ogDescription ?? description} />
    </>
  );
}
