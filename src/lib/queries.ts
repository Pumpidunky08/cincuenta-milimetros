import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type Evento = Tables<"eventos">;
export type TipoFoto = Enums<"tipo_foto">;

type FotoPublicaRow = Tables<"fotografias_publicas">;

/**
 * La vista `fotografias_publicas` expone todas sus columnas como nullable.
 * En la app solo usamos filas completas, así que normalizamos los campos
 * indispensables a no-nulos y filtramos las filas incompletas.
 */
export type FotoPublica = {
  id: string;
  evento_id: string;
  foto_publica_url: string;
  tipo_foto: TipoFoto;
  equipo: string | null;
  categoria: string | null;
  atleta: string | null;
  dorsal: string | null;
  created_at: string | null;
};

function normalizarFoto(row: FotoPublicaRow): FotoPublica | null {
  if (!row.id || !row.evento_id || !row.foto_publica_url) return null;
  return {
    id: row.id,
    evento_id: row.evento_id,
    foto_publica_url: row.foto_publica_url,
    tipo_foto: (row.tipo_foto ?? "individual") as TipoFoto,
    equipo: row.equipo ?? null,
    categoria: row.categoria ?? null,
    atleta: row.atleta ?? null,
    dorsal: row.dorsal ?? null,
    created_at: row.created_at ?? null,
  };
}

// ---------------------------------------------------------
// Nivel 1: Eventos (incluye precios propios del evento)
// ---------------------------------------------------------
export async function getEventos(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("publicado", true)
    .order("fecha", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getEventoPorId(eventoId: string): Promise<Evento | null> {
  const { data, error } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------
// Nivel 2: Equipos dentro de un evento
// Usa la función RPC (DISTINCT real en SQL) en vez de traer
// todas las filas al cliente — necesario con ~250 equipos
// y miles de fotos por evento.
// ---------------------------------------------------------
export async function getEquiposPorEvento(eventoId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_equipos_por_evento", {
    p_evento_id: eventoId,
  });

  if (error) throw error;
  return (data ?? []).map((row) => row.equipo as string);
}

// ---------------------------------------------------------
// Nivel 3: Categorías dentro de un equipo (dentro de un evento)
// ---------------------------------------------------------
export async function getCategoriasPorEquipo(eventoId: string, equipo: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_categorias_por_equipo", {
    p_evento_id: eventoId,
    p_equipo: equipo,
  });

  if (error) throw error;
  return (data ?? []).map((row) => row.categoria as string);
}

// ---------------------------------------------------------
// Conteo por tipo de foto (oficial / individual / rutina)
// útil para mostrar badges antes de cargar el grid completo
// ---------------------------------------------------------
export async function getConteoPorTipo(
  eventoId: string,
  equipo: string,
  categoria: string,
): Promise<Record<TipoFoto, number>> {
  const { data, error } = await supabase.rpc("get_conteo_por_tipo", {
    p_evento_id: eventoId,
    p_equipo: equipo,
    p_categoria: categoria,
  });

  if (error) throw error;

  const base: Record<TipoFoto, number> = { oficial: 0, individual: 0, rutina: 0 };
  for (const row of data ?? []) {
    base[row.tipo_foto as TipoFoto] = Number(row.total);
  }
  return base;
}

// ---------------------------------------------------------
// Nivel 4: Fotos filtradas por evento + equipo + categoría + tipo
// ---------------------------------------------------------
export async function getFotosFiltradas(params: {
  eventoId: string;
  equipo?: string;
  categoria?: string;
  tipoFoto?: TipoFoto;
  busqueda?: string; // solo aplica a fotos individuales (busca por atleta o dorsal)
}): Promise<FotoPublica[]> {
  let query = supabase
    .from("fotografias_publicas")
    .select("*")
    .eq("evento_id", params.eventoId);

  if (params.equipo) query = query.eq("equipo", params.equipo);
  if (params.categoria) query = query.eq("categoria", params.categoria);
  if (params.tipoFoto) query = query.eq("tipo_foto", params.tipoFoto);
  if (params.busqueda) {
    const q = params.busqueda.trim();
    query = query.or(`atleta.ilike.%${q}%,dorsal.ilike.%${q}%`);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalizarFoto).filter((f): f is FotoPublica => f !== null);
}

// ---------------------------------------------------------
// Query keys (para usar con TanStack Query)
// ---------------------------------------------------------
export const queryKeys = {
  eventos: () => ["eventos"] as const,
  evento: (eventoId: string) => ["eventos", eventoId] as const,
  equipos: (eventoId: string) => ["equipos", eventoId] as const,
  categorias: (eventoId: string, equipo: string) => ["categorias", eventoId, equipo] as const,
  conteoPorTipo: (eventoId: string, equipo: string, categoria: string) =>
    ["conteo-tipo", eventoId, equipo, categoria] as const,
  fotos: (params: {
    eventoId: string;
    equipo?: string;
    categoria?: string;
    tipoFoto?: TipoFoto;
    busqueda?: string;
  }) => ["fotos", params] as const,
};