import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { product_id?: string };
  if (!body.product_id) {
    return NextResponse.json({ error: "product_id required" }, { status: 400 });
  }

  const { data: product } = await supabase
    .from("credit_products")
    .select("id, name, credits, price_usd, stripe_price_id")
    .eq("id", body.product_id)
    .eq("active", true)
    .single();

  if (!product || !product.stripe_price_id) {
    return NextResponse.json({ error: "product not available" }, { status: 400 });
  }

  // Derive the return URLs from the request Origin, falling back to an env var.
  // M3 swaps in a custom domain -- this keeps working with no code change.
  const origin =
    req.headers.get("origin") ?? process.env["NEXT_PUBLIC_SITE_URL"] ?? "";

  // No payment_method_types here on purpose. Stripe's Managed Payments is on by
  // default for new accounts and rejects the parameter outright:
  //   "Unsupported parameter: payment_method_types ... handles this for you"
  // Stripe picks the methods; card (incl. 4242 4242 4242 4242) is still offered.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: product.stripe_price_id, quantity: 1 }],
    success_url: `${origin}/credits?purchase=success`,
    cancel_url: `${origin}/credits?purchase=cancelled`,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      product_id: product.id,
      // Stripe metadata values are always strings; String() is the honest form.
      credits: String(product.credits),
    },
  });

  return NextResponse.json({ url: session.url });
}
