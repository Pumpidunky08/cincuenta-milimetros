import { Link } from "@tanstack/react-router";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function AppHeader({ onCart }: { onCart: () => void }) {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-hero text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-lg tracking-tight">CHEER<span className="text-brand">SHOT</span></span>
        </Link>
        <div className="ml-auto">
          <button
            onClick={onCart}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary transition hover:bg-accent"
            aria-label="Abrir carrito"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
