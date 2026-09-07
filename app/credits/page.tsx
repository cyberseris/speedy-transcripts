import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { CreditsPurchase, type CreditProduct } from "@/views/CreditsPurchase";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Credits — Video Speed Reader",
  description: "Buy credits and review your transaction history.",
};

// Balance and ledger move whenever a webhook lands or the worker deducts.
export const dynamic = "force-dynamic";

const TYPE_STYLES: Record<string, string> = {
  purchase: "bg-primary/15 text-primary",
  signup_bonus: "bg-sun/30 text-foreground",
  deduction: "bg-muted text-muted-foreground",
  admin_grant: "bg-teal/20 text-teal-foreground",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ purchase?: string }>;
}) {
  const { purchase } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  const { data: productRows } = await supabase
    .from("credit_products")
    .select("id, name, credits, price_usd, stripe_price_id")
    .eq("active", true)
    .order("price_usd");

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("id, amount, type, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = productRows ?? [];

  // Baseline = the tier with the fewest credits. Every other tier's bonus is
  // measured against its $/credit, so the discount story stays correct even if
  // the tiers get re-priced later by SQL.
  const baseline = rows.reduce<{ price_usd: number; credits: number } | null>(
    (cheapest, row) =>
      cheapest === null || Number(row.credits) < Number(cheapest.credits)
        ? { price_usd: Number(row.price_usd), credits: Number(row.credits) }
        : cheapest,
    null,
  );
  const baselineRate = baseline ? baseline.price_usd / baseline.credits : null;

  const products: CreditProduct[] = rows.map((row) => {
    const price = Number(row.price_usd);
    const credits = Number(row.credits);
    const rate = price / credits;
    // "How many MORE credits than the baseline tier buys per dollar" -- $30 at
    // the $1.00/cr baseline would be 30 credits, this tier gives 45, so +50%.
    // The skill's formula measures the same deal as a per-credit discount and
    // renders +33%; the tier table it ships with says +50%. Bonus-credits is
    // the framing the course advertises and the one users read as the offer.
    const bonusPct =
      baselineRate && baselineRate > 0 && rate > 0
        ? Math.round((baselineRate / rate - 1) * 100)
        : 0;
    return { id: row.id, name: row.name, credits, price_usd: price, bonusPct };
  });

  const balance = profile ? Number(profile.credits_balance) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        {purchase === "success" ? (
          <p className="mb-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
            Payment received. Your credits appear below once Stripe&apos;s webhook lands —
            usually a second or two. Refresh if the balance still looks stale.
          </p>
        ) : null}
        {purchase === "cancelled" ? (
          <p className="mb-6 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
            Checkout cancelled — nothing was charged.
          </p>
        ) : null}

        <section className="blob-card border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Your balance</p>
          <p className="font-display mt-1 text-5xl font-semibold">{balance}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            1 credit = 1 minute of video
          </p>
        </section>

        <h2 className="font-display mt-10 mb-5 text-2xl font-semibold tracking-tight">
          Buy credits
        </h2>
        <CreditsPurchase products={products} />

        <h2 className="font-display mt-12 mb-5 text-2xl font-semibold tracking-tight">
          History
        </h2>
        {transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          TYPE_STYLES[tx.type] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {tx.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {Number(tx.amount) > 0 ? `+${tx.amount}` : tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        )}
      </main>
    </div>
  );
}
