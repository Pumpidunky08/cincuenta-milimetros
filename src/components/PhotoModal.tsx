import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Plus, X } from "lucide-react";
import type { Photo } from "@/lib/data";
import { useCart } from "@/lib/cart-store";

type Props = {
  photo: Photo | null;
  onClose: () => void;
};

export function PhotoModal({ photo, onClose }: Props) {
  const { addPhoto, removePhoto, hasPhoto } = useCart();
  if (!photo) return null;
  const selected = hasPhoto(photo.id);

  return (
    <Dialog open={!!photo} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="relative overflow-hidden rounded-3xl bg-black">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative aspect-[4/5] w-full">
            <img
              src={photo.src}
              alt={photo.team}
              draggable={false}
              className="no-select absolute inset-0 h-full w-full object-cover pointer-events-none"
            />
            {/* Repeating watermark */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-2 grid-rows-4 place-items-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rotate-[-22deg] rounded bg-black/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/70"
                >
                  Preview · No Oficial
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                #{photo.bib} · {photo.category}
              </p>
              <p className="mt-0.5 text-lg font-black text-white">{photo.team}</p>
              <p className="text-xs text-white/70">{photo.athlete}</p>
            </div>
          </div>
          <div className="bg-card p-3">
            <Button
              onClick={() => (selected ? removePhoto(photo.id) : addPhoto(photo))}
              className="w-full"
              variant={selected ? "outline" : "default"}
              size="lg"
            >
              {selected ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> En el carrito
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Añadir al carrito
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
