import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Sparkles, Check, Images, Camera, Video, Mail, X } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CartDrawer } from "@/components/CartDrawer";
import { PhotoCard } from "@/components/PhotoCard";
import { PhotoModal } from "@/components/PhotoModal";
import { events, photos, PRICES, formatCOP, type Photo } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/event/$eventId")({
  head: ({ params }) => {
    const ev = events.find((e) => e.id === params.eventId);
    const title = ev ? `${ev.name} — CheerShot` : "Galería — CheerShot";
    const desc = ev
      ? `Compra las fotografías oficiales de ${ev.name}. ${ev.photoCount.toLocaleString()} fotos disponibles.`
      : "Galería de fotos del evento.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(ev?.cover ? [{ property: "og:image", content: ev.cover }, { name: "twitter:image", content: ev.cover }] : []),
      ],
    };
  },
  loader: ({ params }) => {
    const ev = events.find((e) => e.id === params.eventId);
    if (!ev) throw notFound();
    return { event: ev };
  },
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="font-display text-2xl">Evento no encontrado</p>
        <Link to="/" className="mt-4 inline-block text-brand underline">Volver al inicio</Link>
      </div>
    </div>
  ),
  component: EventPage,
});

const CATEGORIES = ["Todos", "Mini", "Junior", "Open", "Senior"] as const;

function EventPage() {
  const { event } = Route.useLoaderData();
  const [cartOpen, setCartOpen] = useState(false);
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");
  const [team, setTeam] = useState<string>("Todos");
  const [query, setQuery] = useState("");
  const [modalPhoto, setModalPhoto] = useState<Photo | null>(null);
  const { addPack3, addFull, items } = useCart();

  const teams = useMemo(() => ["Todos", ...Array.from(new Set(photos.map((p) => p.team)))], []);

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      if (cat !== "Todos" && p.category !== cat) return false;
      if (team !== "Todos" && p.team !== team) return false;
      if (query) {
        const q = query.toLowerCase().trim();
        if (!p.bib.toLowerCase().includes(q) && !p.athlete.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [cat, team, query]);

  const selectedPhotos = useMemo(
    () => items.filter((i) => i.kind === "photo").map((i) => (i as { kind: "photo"; photo: Photo }).photo),
    [items],
  );

  const handlePack3 = () => {
    if (selectedPhotos.length < 3) {
      toast.error("Selecciona al menos 3 fotos", {
        description: "Toca el botón + en 3 fotos para armar tu pack.",
      });
      return;
    }
    addPack3(selectedPhotos.slice(0, 3));
    toast.success("¡Pack de 3 fotos añadido!");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader onCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <PhotoModal photo={modalPhoto} onClose={() => setModalPhoto(null)} />

      {/* Event header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={event.cover} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-6 text-white">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Todos los eventos
          </Link>
          <h1 className="mt-2 font-display text-2xl leading-tight sm:text-4xl">{event.name}</h1>
          <p className="mt-1 text-xs text-white/70 sm:text-sm">{event.date} · {event.location}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl space-y-2.5 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por dorsal o nombre..."
              className="h-11 rounded-full pl-9 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                  cat === c
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
            <div className="mx-1 w-px shrink-0 bg-border" />
            {teams.map((t) => (
              <button
                key={t}
                onClick={() => setTeam(t)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                  team === t
                    ? "border-transparent bg-brand text-brand-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-5xl px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{filtered.length}</span> fotos
          </p>
          {selectedPhotos.length > 0 && (
            <p className="text-xs font-semibold text-brand">
              <Check className="mr-1 inline h-3 w-3" /> {selectedPhotos.length} seleccionadas
            </p>
          )}
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed py-16 text-center">
            <p className="text-sm text-muted-foreground">No se encontraron fotos con estos filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <PhotoCard key={p.id} photo={p} onOpen={setModalPhoto} />
            ))}
          </div>
        )}
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Paquetes y precios</p>
          <h2 className="mt-1 font-display text-3xl">Elige tu plan perfecto</h2>
          <p className="mt-2 text-sm text-muted-foreground">Recibe tus archivos en alta resolución sin marca de agua.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Individual */}
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-secondary">
              <Camera className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Foto individual</p>
            <p className="mt-1 font-display text-3xl">{formatCOP(PRICES.single)}</p>
            <p className="text-xs text-muted-foreground">por foto</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-brand" /> Alta resolución sin marca de agua</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-brand" /> Envío inmediato al correo</li>
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">Selecciona con el botón + en cada foto.</p>
          </div>

          {/* Pack 3 */}
          <div className="rounded-3xl border bg-card p-6 shadow-card">
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-accent">
              <Images className="h-5 w-5 text-brand" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pack de 3 fotos</p>
            <p className="mt-1 font-display text-3xl">{formatCOP(PRICES.pack3)}</p>
            <p className="text-xs text-muted-foreground">
              Ahorra <span className="font-bold text-brand">{formatCOP(PRICES.single * 3 - PRICES.pack3)}</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-brand" /> 3 fotos de tu elección</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-brand" /> Alta resolución</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-brand" /> Envío inmediato</li>
            </ul>
            <Button onClick={handlePack3} variant="outline" className="mt-5 w-full">
              Armar pack ({selectedPhotos.length}/3)
            </Button>
          </div>

          {/* Full */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-white shadow-glow">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-hype/30 blur-2xl" />
            <div className="absolute right-3 top-3 rounded-full bg-hype px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              Más popular
            </div>
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-hype">Paquete Completo</p>
            <p className="mt-1 font-display text-3xl">{formatCOP(PRICES.full)}</p>
            <p className="text-xs text-white/70">todo incluido</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-hype" /> Todas las fotos individuales</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-hype" /> Fotos oficiales de rutina</li>
              <li className="flex gap-2"><Video className="h-4 w-4 shrink-0 text-hype" /> Video completo de la rutina</li>
              <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-hype" /> Enviado a tu correo</li>
            </ul>
            <Button
              onClick={() => {
                addFull(event.id);
                toast.success("¡Paquete Completo añadido!");
              }}
              className="mt-5 w-full bg-white text-primary hover:bg-white/90"
            >
              Añadir al carrito
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
