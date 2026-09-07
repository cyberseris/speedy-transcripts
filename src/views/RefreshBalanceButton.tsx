"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

// The webhook lands asynchronously, so the balance rendered at first paint can
// be a second stale. This re-runs the server component rather than polling.
export function RefreshBalanceButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  function refresh() {
    setSpinning(true);
    startTransition(() => {
      router.refresh();
      setTimeout(() => setSpinning(false), 600);
    });
  }

  return (
    <Button className="rounded-full" onClick={refresh} disabled={pending || spinning}>
      {pending || spinning ? "Refreshing…" : "Refresh balance"}
    </Button>
  );
}
