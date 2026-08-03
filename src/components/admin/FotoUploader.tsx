import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";

type TipoFoto = Enums<"tipo_foto">;

type EventoOpcion = { id: string; nombre: string };

type EstadoArchivo = {
  nombre: string;
  estado: "pendiente" | "subiendo" | "procesando" | "listo" | "error";
  mensaje?: string;
};

const TIPOS: { value: TipoFoto; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "oficial", label: "Oficial" },
  { value: "rutina", label: "Rutina" },
];

function slug(nombre: string) {
  return nombre
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function FotoUploader() {
  const [eventos, setEventos] = useState<EventoOpcion[]>([]);
  const [eventoId, setEventoId] = useState("");
  const [equipo, setEquipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [tipoFoto, setTipoFoto] = useState<TipoFoto>("individual");
  const [atleta, setAtleta] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [estados, setEstados] = useState<EstadoArchivo[]>([]);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    supabase
      .from("eventos")
      .select("id, nombre")
      .order("fecha", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast.error("No se pudieron cargar los eventos: " + error.message);
          return;
        }
        setEventos(data ?? []);
      });
  }, []);

  function actualizarEstado(index: number, cambios: Partial<EstadoArchivo>) {
    setEstados((cur) => cur.map((e, i) => (i === index ? { ...e, ...cambios } : e)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!eventoId) {
      toast.error("Selecciona un evento");
      return;
    }
    if (archivos.length === 0) {
      toast.error("Selecciona al menos una foto");
      return;
    }

    setSubiendo(true);
    setEstados(archivos.map((f) => ({ nombre: f.name, estado: "pendiente" })));

    let correctas = 0;

    for (let i = 0; i < archivos.length; i++) {
      const file = archivos[i];
      const path = `${eventoId}/${crypto.randomUUID()}-${slug(file.name)}`;

      actualizarEstado(i, { estado: "subiendo" });

      const { error: uploadError } = await supabase.storage
        .from("fotos-privadas")
        .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });

      if (uploadError) {
        actualizarEstado(i, { estado: "error", mensaje: uploadError.message });
        continue;
      }

      actualizarEstado(i, { estado: "procesando" });

      const { data: preview, error: fnError } = await supabase.functions.invoke<{
        foto_publica_url?: string;
        error?: string;
      }>("generar-preview", { body: { path } });

      if (fnError || !preview?.foto_publica_url) {
        actualizarEstado(i, {
          estado: "error",
          mensaje: fnError?.message ?? preview?.error ?? "No se pudo generar la vista previa",
        });
        continue;
      }

      const { error: insertError } = await supabase.from("fotografias").insert({
        evento_id: eventoId,
        foto_privada_path: path,
        foto_publica_url: preview.foto_publica_url,
        equipo: equipo.trim() || null,
        categoria: categoria.trim() || null,
        atleta: atleta.trim() || null,
        dorsal: dorsal.trim() || null,
        tipo_foto: tipoFoto,
      });

      if (insertError) {
        actualizarEstado(i, { estado: "error", mensaje: insertError.message });
        continue;
      }

      correctas++;
      actualizarEstado(i, { estado: "listo" });
    }

    setSubiendo(false);

    if (correctas === archivos.length) {
      toast.success(`${correctas} foto(s) publicadas con vista previa`);
      setArchivos([]);
    } else {
      toast.error(`${correctas} de ${archivos.length} fotos se procesaron correctamente`);
    }
  }

  const completadas = estados.filter((e) => e.estado === "listo" || e.estado === "error").length;
  const progreso = estados.length ? Math.round((completadas / estados.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground">Subir fotos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Sube los archivos originales. Cada uno se guarda en el almacenamiento privado y se genera
        automáticamente una vista previa reducida con marca de agua para la galería.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label>Evento *</Label>
          <Select value={eventoId} onValueChange={setEventoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un evento" />
            </SelectTrigger>
            <SelectContent>
              {eventos.map((ev) => (
                <SelectItem key={ev.id} value={ev.id}>
                  {ev.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="equipo">Equipo</Label>
            <Input id="equipo" value={equipo} onChange={(e) => setEquipo(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría</Label>
            <Input id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de foto</Label>
            <Select value={tipoFoto} onValueChange={(v) => setTipoFoto(v as TipoFoto)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="atleta">Atleta</Label>
            <Input id="atleta" value={atleta} onChange={(e) => setAtleta(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dorsal">Dorsal</Label>
            <Input id="dorsal" value={dorsal} onChange={(e) => setDorsal(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="archivos">Fotos originales *</Label>
          <Input
            id="archivos"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
          />
          {archivos.length > 0 && (
            <p className="text-xs text-muted-foreground">{archivos.length} archivo(s) seleccionado(s)</p>
          )}
        </div>

        {estados.length > 0 && (
          <div className="space-y-3 rounded-xl border border-border bg-card/50 p-4">
            <Progress value={progreso} />
            <ul className="space-y-1 text-xs">
              {estados.map((e, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <span className="truncate text-muted-foreground">{e.nombre}</span>
                  <span
                    className={
                      e.estado === "error"
                        ? "shrink-0 text-destructive"
                        : e.estado === "listo"
                          ? "shrink-0 text-emerald-600"
                          : "shrink-0 text-muted-foreground"
                    }
                  >
                    {e.estado === "error" ? `Error: ${e.mensaje}` : e.estado}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={subiendo}>
          {subiendo ? "Procesando..." : "Subir y generar vistas previas"}
        </Button>
      </form>
    </div>
  );
}
