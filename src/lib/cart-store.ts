import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { createElement } from "react";
import { PRICES, type Photo } from "./data";

export type CartItem =
  | { kind: "photo"; photo: Photo }
  | { kind: "pack3"; photos: Photo[]; id: string }
  | { kind: "full"; eventId: string; id: string };

type CartCtx = {
  items: CartItem[];
  addPhoto: (p: Photo) => void;
  removePhoto: (id: string) => void;
  hasPhoto: (id: string) => boolean;
  addPack3: (photos: Photo[]) => void;
  addFull: (eventId: string) => void;
  remove: (index: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addPhoto = useCallback((p: Photo) => {
    setItems((cur) => (cur.some((i) => i.kind === "photo" && i.photo.id === p.id) ? cur : [...cur, { kind: "photo", photo: p }]));
  }, []);
  const removePhoto = useCallback((id: string) => {
    setItems((cur) => cur.filter((i) => !(i.kind === "photo" && i.photo.id === id)));
  }, []);
  const hasPhoto = useCallback(
    (id: string) => items.some((i) => i.kind === "photo" && i.photo.id === id),
    [items],
  );
  const addPack3 = useCallback((photos: Photo[]) => {
    setItems((cur) => [...cur, { kind: "pack3", photos, id: `pack-${Date.now()}` }]);
  }, []);
  const addFull = useCallback((eventId: string) => {
    setItems((cur) => (cur.some((i) => i.kind === "full") ? cur : [...cur, { kind: "full", eventId, id: `full-${Date.now()}` }]));
  }, []);
  const remove = useCallback((index: number) => {
    setItems((cur) => cur.filter((_, i) => i !== index));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(
    () =>
      items.reduce((sum, i) => {
        if (i.kind === "photo") return sum + PRICES.single;
        if (i.kind === "pack3") return sum + PRICES.pack3;
        return sum + PRICES.full;
      }, 0),
    [items],
  );

  const value: CartCtx = { items, addPhoto, removePhoto, hasPhoto, addPack3, addFull, remove, clear, total, count: items.length };
  return createElement(Ctx.Provider, { value }, children);
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
