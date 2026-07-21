import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, MapPin, Camera, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { events } from "@/lib/data";
import { AppHeader } from "@/components/AppHeader";
import { CartDrawer } from "@/components/CartDrawer";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-cheer.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "50milimet — Fotografías oficiales de porrismo y cheerleading" },
      {
        name: "description",
        content:
          "Encuentra y compra las fotografías oficiales de tu equipo directamente desde las gradas del torneo. Alta resolución, entrega inmediata.",
      },
      { property: "og:title", content: "50milimet — Fotografías oficiales de porrismo y cheerleading" },
      { property: "og:description", content: "Encuentra y compra las fotografías oficiales de tu equipo directamente desde las gradas del torneo. Alta resolución, entrega inmediata." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <AppHeader onCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-10 text-white sm:pt-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest backdrop-blur">
            <Zap className="h-3 w-3" /> En vivo desde el torneo
          </span>
          <h1 className="mt-4 font-display text-4xl leading-[0.95] sm:text-6xl">
            Cada salto,<br />
            cada <span className="text-hype">stunt</span>,<br />
            capturado.
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/85 sm:text-base">
            Encuentra las fotos oficiales de tu equipo minutos después de la rutina. Compra desde tu celular, recíbelas en tu correo.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" /> Contenido protegido</span>
            <span>·</span>
            <span>Alta resolución</span>
            <span>·</span>
            <span>Entrega inmediata</span>
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Eventos activos</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl">Elige tu torneo</h2>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{events.length} activos</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <Link
              key={e.id}
              to="/event/$eventId"
              params={{ eventId: e.id }}
              className="group relative overflow-hidden rounded-3xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-glow"
            >
              <div className="relative aspect-[5/4] overflow-hidden">
                <img src={e.cover} alt={e.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-brand-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Activo
                </div>
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  <Camera className="h-3 w-3" /> {e.photoCount.toLocaleString()}
                </div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-display text-lg leading-tight">{e.name}</h3>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                </div>
                <Button variant="default" size="sm" className="mt-4 w-full">
                  Ver fotografías <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-10">
          <div className="mb-6 flex items-center gap-2 text-hype">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Cómo funciona</span>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { n: "01", t: "Encuentra tu equipo", d: "Filtra por categoría, nombre del equipo o dorsal." },
              { n: "02", t: "Selecciona tus fotos", d: "Añade fotos individuales o el paquete completo." },
              { n: "03", t: "Recíbelas al instante", d: "Archivos originales enviados a tu correo." },
            ].map((s) => (
              <div key={s.n}>
                <p className="font-display text-3xl text-hype">{s.n}</p>
                <p className="mt-2 font-display text-lg">{s.t}</p>
                <p className="mt-1 text-sm text-primary-foreground/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
