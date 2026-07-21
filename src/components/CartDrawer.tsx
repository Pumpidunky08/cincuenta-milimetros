import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, Sparkles, Images, Camera } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatCOP } from "@/lib/data";
import { useNavigate } from "@tanstack/react-router";

type Props = { open: boolean; onOpenChange: (o: boolean) => void };

export function CartDrawer({ open, onOpenChange }: Props) {
  const { items, remove, total, count } = useCart();
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b bg-gradient-hero p-5 text-white">
          <SheetTitle className="flex items-center gap-2 text-white">
            <ShoppingBag className="h-5 w-5" />
            <span className="font-display text-xl">Tu carrito</span>
            <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-xs">{count}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 grid h-16 w-16 place-items-center rounded-full bg-muted">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold">Carrito vacío</p>
              <p className="mt-1 text-sm text-muted-foreground">Añade fotos o un paquete para comenzar.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card">
                  {item.kind === "photo" && (
                    <>
                      <img src={item.photo.src} alt="" className="h-16 w-16 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand">
                          <Camera className="mr-1 inline h-3 w-3" /> Foto individual
                        </p>
                        <p className="truncate text-sm font-semibold">#{item.photo.bib} · {item.photo.team}</p>
                        <p className="text-xs text-muted-foreground">{formatCOP(12000)}</p>
                      </div>
                    </>
                  )}
                  {item.kind === "pack3" && (
                    <>
                      <div className="grid h-16 w-16 shrink-0 grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
                        {item.photos.slice(0, 4).map((p) => (
                          <img key={p.id} src={p.src} alt="" className="h-full w-full object-cover" />
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand">
                          <Images className="mr-1 inline h-3 w-3" /> Pack de 3 fotos
                        </p>
                        <p className="text-sm font-semibold">{item.photos.length} fotos seleccionadas</p>
                        <p className="text-xs text-muted-foreground">{formatCOP(30000)}</p>
                      </div>
                    </>
                  )}
                  {item.kind === "full" && (
                    <>
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-hype">
                        <Sparkles className="h-7 w-7 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-brand">
                          <Sparkles className="mr-1 inline h-3 w-3" /> Paquete Completo
                        </p>
                        <p className="text-sm font-semibold">Todas las fotos + video</p>
                        <p className="text-xs text-muted-foreground">{formatCOP(75000)}</p>
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => remove(idx)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t bg-card p-4 pb-6">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl">{formatCOP(total)}</span>
            </div>
            <Button
              size="lg"
              className="w-full bg-gradient-hype text-white hover:opacity-95"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/checkout" });
              }}
            >
              Ir a pagar
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Recibirás los archivos originales en alta resolución sin marca de agua.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
