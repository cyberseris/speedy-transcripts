import { useEffect, useState } from "react";
import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState =
  { status: "loading" } | { status: "authenticated"; user: User } | { status: "unauthenticated" };

type AuthContext = { user: User };

// Client-side replacement for the old `_authenticated` route's `beforeLoad`
// guard (which ran with `ssr: false` anyway, so this is the same check, just
// run from an effect instead of a route loader).
export function RequireAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setState(
        error || !data.user
          ? { status: "unauthenticated" }
          : { status: "authenticated", user: data.user },
      );
    });
    return () => {
      active = false;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div
          className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (state.status === "unauthenticated") {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet context={{ user: state.user } satisfies AuthContext} />;
}

export function useAuthUser() {
  return useOutletContext<AuthContext>();
}
