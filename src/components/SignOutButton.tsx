"use client";

import { useRouter } from "next/navigation";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Button size="sm" variant="outline" className="rounded-full" onClick={signOut}>
      Sign out
    </Button>
  );
}
