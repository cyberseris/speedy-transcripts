"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export type CreditProduct = {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
  bonusPct: number;
};

export function CreditsPurchase({ products }: { products: CreditProduct[] }) {
  // One in-flight checkout at a time -- otherwise a double-click opens two
  // Checkout Sessions and the user can pay twice for one intent.
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(productId: string) {
    setError(null);
    setPurchasingId(productId);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "Checkout failed");
        setPurchasingId(null);
        return;
      }

      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch {
      setError("Checkout failed — please try again.");
      setPurchasingId(null);
    }
  }

  return (
    <div>
      {error ? (
        <p className="mb-4 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 md:grid-cols-3">
        {products.map((product) => (
          <article
            key={product.id}
            className="blob-card flex h-full flex-col border border-border bg-card p-6"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display text-xl font-semibold">{product.name}</h3>
              {product.bonusPct > 0 ? (
                <span className="rounded-full bg-teal/20 px-2.5 py-1 text-xs font-semibold text-teal-foreground">
                  +{product.bonusPct}%
                </span>
              ) : null}
            </div>

            <p className="font-display mt-4 text-3xl font-semibold">
              ${product.price_usd.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {product.credits} credits · ${(product.price_usd / product.credits).toFixed(3)} each
            </p>

            <Button
              className="mt-6 w-full rounded-full"
              disabled={purchasingId !== null}
              onClick={() => void buy(product.id)}
            >
              {purchasingId === product.id ? "Redirecting…" : "Buy"}
            </Button>
          </article>
        ))}
      </div>
    </div>
  );
}
