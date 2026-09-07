import Stripe from "stripe";

if (!process.env["STRIPE_SECRET_KEY"]) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

// apiVersion is typed as a single literal (LatestApiVersion) by the SDK, so it
// must match the installed stripe version exactly -- hence the exact pin in
// package.json rather than a ^22 range. Bumping stripe means bumping this too.
export const stripe = new Stripe(process.env["STRIPE_SECRET_KEY"], {
  apiVersion: "2026-08-26.dahlia",
});
