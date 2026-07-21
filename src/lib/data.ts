import photo1 from "@/assets/photo-1.jpg";
import photo2 from "@/assets/photo-2.jpg";
import photo3 from "@/assets/photo-3.jpg";
import photo4 from "@/assets/photo-4.jpg";
import photo5 from "@/assets/photo-5.jpg";
import photo6 from "@/assets/photo-6.jpg";
import photo7 from "@/assets/photo-7.jpg";
import photo8 from "@/assets/photo-8.jpg";

export type Event = {
  id: string;
  name: string;
  date: string;
  location: string;
  cover: string;
  photoCount: number;
  status: "activo" | "proximo";
};

export type Photo = {
  id: string;
  src: string;
  team: string;
  category: "Junior" | "Open" | "Senior" | "Mini";
  athlete: string;
  bib: string;
};

export const events: Event[] = [
  {
    id: "campeonato-nacional-2025",
    name: "Campeonato Nacional de Porrismo 2025",
    date: "15 Nov 2025",
    location: "Coliseo El Salitre, Bogotá",
    cover: photo2,
    photoCount: 1842,
    status: "activo",
  },
  {
    id: "copa-elite-cheer",
    name: "Copa Elite Cheer",
    date: "22 Nov 2025",
    location: "Movistar Arena",
    cover: photo4,
    photoCount: 967,
    status: "activo",
  },
  {
    id: "regional-cheer-power",
    name: "Regional Cheer Power",
    date: "06 Dic 2025",
    location: "Coliseo Cubierto, Medellín",
    cover: photo7,
    photoCount: 1204,
    status: "activo",
  },
];

const teams = ["Thunder Cats", "Fire Angels", "Golden Eagles", "Storm Rebels", "Pink Panthers", "Blue Wolves"];
const categories: Photo["category"][] = ["Mini", "Junior", "Open", "Senior"];
const athletes = ["Sofía R.", "Valentina M.", "Camila G.", "Isabella P.", "Mariana L.", "Luciana T.", "Sara V.", "Antonia J."];
const srcs = [photo1, photo2, photo3, photo4, photo5, photo6, photo7, photo8];

export const photos: Photo[] = Array.from({ length: 36 }, (_, i) => ({
  id: `p-${i + 1}`,
  src: srcs[i % srcs.length],
  team: teams[i % teams.length],
  category: categories[i % categories.length],
  athlete: athletes[i % athletes.length],
  bib: String(101 + (i % 24)),
}));

export const PRICES = {
  single: 12000,
  pack3: 30000,
  full: 75000,
} as const;

export const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
