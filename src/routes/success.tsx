import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Mail, Sparkles, ArrowRight } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ email: z.string().optional() });

export const Route = createFileRoute("/success")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "¡Compra exitosa! — CheerShot" },
      { name: "description", content: "Tu pedido ha sido confirmado." },
      { property: "og:title", content: "¡Compra exitosa! — CheerShot" },
      { property: "og:description", content: "Fotos enviadas al correo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { email } = Route.useSearch();
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-6 grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-brand/20" />
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-hype shadow-glow">
            <CheckCircle2 className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
          <Sparkles className="h-3 w-3" /> Pago confirmado
        </div>
        <h1 className="mt-4 font-display text-4xl leading-tight">¡Listo, campeón!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tu compra fue procesada con éxito. Los archivos en alta resolución sin marca de agua
          {email ? <> han sido enviados a <span className="font-semibold text-foreground">{email}</span></> : " han sido enviados a tu correo"}.
        </p>

        <div className="mt-6 rounded-2xl border bg-card p-4 text-left shadow-card">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent">
              <Mail className="h-5 w-5 text-brand" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">Revisa tu bandeja de entrada</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                El correo llega en 1-3 minutos. Si no aparece, revisa tu carpeta de spam.
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Ver más eventos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
