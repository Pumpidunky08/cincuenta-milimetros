import { Check, Plus } from "lucide-react";
import type { Photo } from "@/lib/data";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

type Props = {
  photo: Photo;
  onOpen: (p: Photo) => void;
};

export function PhotoCard({ photo, onOpen }: Props) {
  const { addPhoto, removePhoto, hasPhoto } = useCart();
  const selected = hasPhoto(photo.id);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-muted shadow-card">
      <button
        type="button"
        onClick={() => onOpen(photo)}
        className="relative block aspect-[4/5] w-full overflow-hidden"
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={photo.src}
          alt={`${photo.team} - ${photo.athlete}`}
          draggable={false}
          className="no-select absolute inset-0 h-full w-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
        />
        {/* watermark overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rotate-[-18deg] rounded-md bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/85 backdrop-blur-[1px] sm:text-xs">
            Preview · No Oficial
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2.5">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-white/80">#{photo.bib}</p>
            <p className="truncate text-xs font-semibold text-white">{photo.team}</p>
          </div>
        </div>
      </button>

      <button
        type="button"
        aria-label={selected ? "Quitar del carrito" : "Añadir al carrito"}
        onClick={(e) => {
          e.stopPropagation();
          selected ? removePhoto(photo.id) : addPhoto(photo);
        }}
        className={cn(
          "absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full shadow-lg transition-all active:scale-90",
          selected
            ? "bg-brand text-brand-foreground shadow-glow"
            : "bg-white/95 text-foreground hover:bg-white",
        )}
      >
        {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : <Plus className="h-4 w-4" strokeWidth={3} />}
      </button>
    </div>
  );
}
