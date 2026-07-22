import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Panel de administración — 50milimet" },
      { name: "description", content: "Panel interno para administradores de 50milimet." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type AuthState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "not_admin"; email: string | null }
  | { status: "admin"; email: string | null };

function AdminPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data: userData } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!userData.user) {
        setState({ status: "signed_out" });
        return;
      }
      const { data: isAdmin, error } = await supabase.rpc("is_admin");
      if (cancelled) return;
      if (error) {
        toast.error(error.message);
        setState({ status: "not_admin", email: userData.user.email ?? null });
        return;
      }
      setState({
        status: isAdmin ? "admin" : "not_admin",
        email: userData.user.email ?? null,
      });
    }

    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (state.status === "signed_out") {
      navigate({ to: "/admin/login" });
    }
  }, [state.status, navigate]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  if (state.status === "loading" || state.status === "signed_out") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Cargando…
      </main>
    );
  }

  if (state.status === "not_admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-foreground">No autorizado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La cuenta {state.email ?? ""} no tiene permisos de administrador.
          </p>
          <Button className="mt-6 w-full" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Panel de administración</h1>
          <p className="text-xs text-muted-foreground">{state.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Cerrar sesión
        </Button>
      </header>
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <h2 className="text-xl font-semibold text-foreground">Bienvenido</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Aquí irán las herramientas para crear eventos y subir fotografías.
          </p>
        </div>
      </section>
    </main>
  );
}
