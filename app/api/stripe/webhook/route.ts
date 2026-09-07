import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";

import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";

// This route must be excluded from middleware.ts -- see the matcher there.
// If auth middleware runs on it, Stripe either gets a 307 to /sign-in or the
// session refresh mangles the body and every signature check fails.
export async function POST(req: NextRequest) {
  // RAW body. Stripe signs the exact byte stream, so req.json() first would
  // reformat whitespace and verification would fail with a confusing 400.
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");
  if (!sig) return new NextResponse("no signature", { status: 400 });

  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new NextResponse("not configured", { status: 500 });
  }

  // Verify BEFORE any 200. A non-200 tells Stripe to retry, which is what we
  // want for transient errors -- but acknowledging an unverified request would
  // let a forged call through.
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("webhook signature verification failed", err);
    return new NextResponse("invalid signature", { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, unpaid: true });
  }

  const userId = session.metadata?.["user_id"];
  const productId = session.metadata?.["product_id"];
  const credits = Number(session.metadata?.["credits"]);
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!userId || !productId || !credits || !paymentIntentId) {
    console.error("webhook missing required fields", {
      userId,
      productId,
      credits,
      paymentIntentId,
    });
    return new NextResponse("missing metadata", { status: 400 });
  }

  const svc = createServiceClient();

  // The ledger row lands first and is the source of truth; the balance is
  // derived from it. Idempotency comes from the partial UNIQUE INDEX on
  // stripe_payment_intent_id -- a SELECT-then-INSERT would leave a TOCTOU
  // window open to two Stripe retries arriving in the same tick.
  const { error: insertErr } = await svc.from("credit_transactions").insert({
    user_id: userId,
    amount: credits,
    type: "purchase",
    description: `Purchased ${credits} credits`,
    stripe_payment_intent_id: paymentIntentId,
  });

  if (insertErr) {
    // 23505 = unique_violation = we already booked this payment_intent. That is
    // idempotency working, so return 200 and Stripe stops retrying.
    if (insertErr.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("ledger insert failed", insertErr);
    return new NextResponse("db insert failed", { status: 500 });
  }

  const { data: profile } = await svc
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .single();

  const newBalance = Number(profile?.credits_balance ?? 0) + credits;

  const { error: updateErr } = await svc
    .from("profiles")
    .update({ credits_balance: newBalance })
    .eq("id", userId);

  if (updateErr) {
    // The ledger row exists but the balance did not move. Recoverable by hand:
    //   UPDATE profiles SET credits_balance =
    //     (SELECT SUM(amount) FROM credit_transactions WHERE user_id = '...')
    console.error("balance update failed", updateErr);
    return new NextResponse("balance update failed", { status: 500 });
  }

  return NextResponse.json({ received: true, credited: credits });
}
