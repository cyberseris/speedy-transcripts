import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageMeta } from "@/components/PageMeta";
import { useAuthUser } from "@/components/RequireAuth";

export function AppShell() {
  const { user } = useAuthUser();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PageMeta
        title="Dashboard — Video Speed Reader"
        description="Your Video Speed Reader dashboard."
      />
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-4">
          <span className="text-base font-semibold tracking-tight">Video Speed Reader</span>
          <Button size="sm" variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="hero-glow flex-1">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <h1 className="text-3xl font-semibold tracking-tight">Hi {user.email}</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Your dashboard is coming soon. Upload functionality will be added in the next milestone.
          </p>
        </div>
      </main>
    </div>
  );
}
