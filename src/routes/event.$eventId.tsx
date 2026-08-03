import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Sparkles, Check, Images, Camera, Video, Mail, X, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { CartDrawer } from "@/components/CartDrawer";
import { PhotoCard } from "@/components/PhotoCard";
import { PhotoModal } from "@/components/PhotoModal";
import { formatCOP } from "@/lib/data";
import {
  getEventoPorId,
  getEquiposPorEvento,
  getCategoriasPorEquipo,
  getFotosFiltradas,
  queryKeys,
  type FotoPublica,
  type TipoFoto,
} from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/event/$eventId")({
  loader: async ({ params }) => {
    const evento = await getEventoPorId(params.eventId);
    if (!evento) throw notFound();
    return { evento };
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

const TIPOS: { value: TipoFoto; label: string }[] = [
  { value: "individual", label: "Individuales" },
  { value: "oficial", label: "Oficiales" },
  { value: "rutina", label: "Rutina" },
];

function EventPage() {
  const { evento } = Route.useLoaderData();
  const [cartOpen, setCartOpen] = useState(false);
  const [equipo, setEquipo] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoFoto>("individual");
  const [query, setQuery] = useState("");
  const [modalPhoto, setModalPhoto] = useState<FotoPublica | null>(null);
  const { addPack3, addFull, removePhoto, items, setPricing } = useCart();

  // El carrito usa los precios de ESTE evento en vez de un precio global fijo
  useEffect(() => {
    setPricing({
      single: Number(evento.precio_individual),
      pack3: Number(evento.precio_pack3),
      full: Number(evento.precio_paquete_completo),
    });
  }, [evento, setPricing]);

  const { data: equipos, isLoading: cargandoEquipos } = useQuery({
    queryKey: queryKeys.equipos(evento.id),
    queryFn: () => getEquiposPorEvento(evento.id),
  });

  const { data: categorias, isLoading: cargandoCategorias } = useQuery({
    queryKey: equipo ? queryKeys.categorias(evento.id, equipo) : ["categorias", evento.id, "none"],
    queryFn: () => getCategoriasPorEquipo(evento.id, equipo as string),
    enabled: !!equipo,
  });

  const { data: fotos, isLoading: cargandoFotos } = useQuery({
    queryKey: queryKeys.fotos({ eventoId: evento.id, equipo: equipo ?? undefined, categoria: categoria ?? undefined, tipoFoto: tipo, busqueda: query || undefined }),
    queryFn: () =>
      getFotosFiltradas({
        eventoId: evento.id,
        equipo: equipo ?? undefined,
        categoria: categoria ?? undefined,
        tipoFoto: tipo,
        busqueda: tipo === "individual" && query ? query : undefined,
      }),
    enabled: !!equipo && !!categoria,
  });

  const selectedPhotos = useMemo(
    () => items.filter((i) => i.kind === "photo").map((i) => (i as { kind: "photo"; photo: FotoPublica }).photo),
    [items],
  );

  const handlePack3 = () => {
    if (selectedPhotos.length < 3) {
      toast.error("Selecciona al menos 3 fotos", {
        description: "Toca el botón + en 3 fotos para armar tu pack.",
      });
      return;
    }
    const paraElPack = selectedPhotos.slice(0, 3);
    addPack3(paraElPack);
    // Evita el doble cobro: estas 3 fotos ya no deben seguir contando
    // como ítems individuales sueltos en el carrito.
    paraElPack.forEach((p) => removePhoto(p.id));
    toast.success("¡Pack de 3 fotos añadido!");
  };

  function handleSeleccionarEquipo(nuevoEquipo: string) {
    setEquipo(nuevoEquipo);
    setCategoria(null);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader onCart={() => setCartOpen(true)} />
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
      <PhotoModal photo={modalPhoto} onClose={() => setModalPhoto(null)} />

      {/* Event header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          {evento.portada_url && <img src={evento.portada_url} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 py-6 text-white">
          <Link to="/" className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Todos los eventos
          </Link>
          <h1 className="mt-2 font-display text-2xl leading-tight sm:text-4xl">{evento.nombre}</h1>
          <p className="mt-1 text-xs text-white/70 sm:text-sm">
            {evento.fecha && new Date(evento.fecha + "T00:00:00").toLocaleDateString("es-CO")}
            {evento.fecha && evento.ubicacion && " · "}
            {evento.ubicacion}
          </p>
        </div>
      </div>

      {/* Paso 1: elegir equipo */}
      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">1. Elige tu equipo</h2>
        </div>
        {cargandoEquipos && <p className="text-sm text-muted-foreground">Cargando equipos...</p>}
        {!cargandoEquipos && equipos && equipos.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no hay fotos cargadas para este evento.</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {equipos?.map((e) => (
            <button
              key={e}
              onClick={() => handleSeleccionarEquipo(e)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                equipo === e
                  ? "border-transparent bg-brand text-brand-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      {/* Paso 2: elegir categoría (solo si ya hay equipo) */}
      {equipo && (
        <section className="mx-auto max-w-5xl px-4 pb-6">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">2. Elige la categoría</h2>
          {cargandoCategorias && <p className="text-sm text-muted-foreground">Cargando categorías...</p>}
          <div className="flex flex-wrap gap-1.5">
            {categorias?.map((c) => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                  categoria === c
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Paso 3: tipo de foto + búsqueda + grid (solo si ya hay equipo y categoría) */}
      {equipo && categoria && (
        <>
          <div className="sticky top-14 z-20 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto max-w-5xl space-y-2.5 px-4 py-3">
              <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
                {TIPOS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={cn(
                      "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                      tipo === t.value
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {tipo === "individual" && (
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
              )}
            </div>
          </div>

          {/* Grid */}
          <section className="mx-auto max-w-5xl px-4 py-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{fotos?.length ?? 0}</span> fotos
              </p>
              {selectedPhotos.length > 0 && (
                <p className="text-xs font-semibold text-brand">
                  <Check className="mr-1 inline h-3 w-3" /> {selectedPhotos.length} seleccionadas
                </p>
              )}
            </div>
            {cargandoFotos && (
              <div className="rounded-3xl border border-dashed py-16 text-center">
                <p className="text-sm text-muted-foreground">Cargando fotos...</p>
              </div>
            )}
            {!cargandoFotos && fotos && fotos.length === 0 && (
              <div className="rounded-3xl border border-dashed py-16 text-center">
                <p className="text-sm text-muted-foreground">No se encontraron fotos con estos filtros.</p>
              </div>
            )}
            {!cargandoFotos && fotos && fotos.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {fotos.map((p) => (
                  <PhotoCard key={p.id} photo={p} onOpen={setModalPhoto} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

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
            <p className="mt-1 font-display text-3xl">{formatCOP(Number(evento.precio_individual))}</p>
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
            <p className="mt-1 font-display text-3xl">{formatCOP(Number(evento.precio_pack3))}</p>
            <p className="text-xs text-muted-foreground">
              Ahorra{" "}
              <span className="font-bold text-brand">
                {formatCOP(Number(evento.precio_individual) * 3 - Number(evento.precio_pack3))}
              </span>
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
            <p className="mt-1 font-display text-3xl">{formatCOP(Number(evento.precio_paquete_completo))}</p>
            <p className="text-xs text-white/70">todo incluido</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-hype" /> Todas las fotos individuales</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-hype" /> Fotos oficiales de rutina</li>
              <li className="flex gap-2"><Video className="h-4 w-4 shrink-0 text-hype" /> Video completo de la rutina</li>
              <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-hype" /> Enviado a tu correo</li>
            </ul>
            <Button
              onClick={() => {
                addFull(evento.id);
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