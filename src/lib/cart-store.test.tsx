import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./cart-store";
import { PRICES, type Photo } from "./data";

const photo = (id: string): Photo => ({
  id,
  src: "",
  team: "Team A",
  category: "Junior",
  athlete: "Athlete " + id,
  bib: id,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const setup = () => renderHook(() => useCart(), { wrapper });

describe("cart store — 3-photo pack behavior", () => {
  it("adds a single pack line item priced at PRICES.pack3", () => {
    const { result } = setup();
    const photos = [photo("1"), photo("2"), photo("3")];

    act(() => result.current.addPack3(photos));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].kind).toBe("pack3");
    expect(result.current.count).toBe(1);
    expect(result.current.total).toBe(PRICES.pack3);
  });

  it("does not create individual photo line items when a pack is added", () => {
    const { result } = setup();
    const photos = [photo("1"), photo("2"), photo("3")];

    act(() => result.current.addPack3(photos));

    expect(result.current.items.some((i) => i.kind === "photo")).toBe(false);
  });

  it("does not double-charge when a pack is added alongside individually selected photos", () => {
    const { result } = setup();
    const photos = [photo("1"), photo("2"), photo("3")];

    act(() => {
      photos.forEach((p) => result.current.addPhoto(p));
      result.current.addPack3(photos);
    });

    const packLines = result.current.items.filter((i) => i.kind === "pack3");
    const photoLines = result.current.items.filter((i) => i.kind === "photo");

    // Only one pack should exist for the same selection
    expect(packLines).toHaveLength(1);
    // Total must equal exactly pack price + any remaining individual photos.
    const expected = PRICES.pack3 + photoLines.length * PRICES.single;
    expect(result.current.total).toBe(expected);
  });

  it("removes only the pack when remove is called on its index, leaving other items intact", () => {
    const { result } = setup();
    const p1 = photo("1");

    act(() => {
      result.current.addPhoto(p1);
      result.current.addPack3([photo("2"), photo("3"), photo("4")]);
    });
    expect(result.current.items).toHaveLength(2);

    const packIndex = result.current.items.findIndex((i) => i.kind === "pack3");
    act(() => result.current.remove(packIndex));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].kind).toBe("photo");
    expect(result.current.total).toBe(PRICES.single);
  });

  it("supports adding multiple distinct packs and totals them correctly", () => {
    const { result } = setup();

    act(() => {
      result.current.addPack3([photo("1"), photo("2"), photo("3")]);
      result.current.addPack3([photo("4"), photo("5"), photo("6")]);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.total).toBe(PRICES.pack3 * 2);
  });

  it("clear() empties the cart including packs", () => {
    const { result } = setup();

    act(() => {
      result.current.addPack3([photo("1"), photo("2"), photo("3")]);
      result.current.addPhoto(photo("9"));
      result.current.clear();
    });

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.count).toBe(0);
  });

  it("addPhoto is idempotent per photo id (no accidental quantity duplication)", () => {
    const { result } = setup();
    const p = photo("1");

    act(() => {
      result.current.addPhoto(p);
      result.current.addPhoto(p);
      result.current.addPhoto(p);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(PRICES.single);
  });

  it("removePhoto removes an individual photo but preserves packs containing the same photo", () => {
    const { result } = setup();
    const shared = photo("1");

    act(() => {
      result.current.addPhoto(shared);
      result.current.addPack3([shared, photo("2"), photo("3")]);
      result.current.removePhoto(shared.id);
    });

    expect(result.current.items.some((i) => i.kind === "photo")).toBe(false);
    expect(result.current.items.filter((i) => i.kind === "pack3")).toHaveLength(1);
    expect(result.current.total).toBe(PRICES.pack3);
  });
});
