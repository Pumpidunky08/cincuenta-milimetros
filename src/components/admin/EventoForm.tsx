import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const DEFAULTS = {
  precioIndividual: 15000,
  precioPack3: 40000,
  precioPaqueteCompleto: 130000,
};

export function EventoForm() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [portadaUrl, setPortadaUrl] = useState("");
  const [precioIndividual, setPrecioIndividual] = useState(String(DEFAULTS.precioIndividual));
  const [precioPack3, setPrecioPack3] = useState(String(DEFAULTS.precioPack3));
  const [precioPaqueteCompleto, setPrecioPaqueteCompleto] = useState(String(DEFAULTS.precioPaqueteCompleto));
  const [publicado, setPublicado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimoEventoId, setUltimoEventoId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.error("El nombre del evento es obligatorio");
      return;
    }

    setGuardando(true);
    setUltimoEventoId(null);

    const { data, error } = await supabase
      .from("eventos")
      .insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        fecha: fecha || null,
        ubicacion: ubicacion.trim() || null,
        portada_url: portadaUrl.trim() || null,
        precio_individual: Number(precioIndividual),
        precio_pack3: Number(precioPack3),
        precio_paquete_completo: Number(precioPaqueteCompleto),
        publicado,
      })
      .select("id")
      .single();

    setGuardando(false);

    if (error) {
      toast.error("Error creando el evento: " + error.message);
      return;
    }

    toast.success("¡Evento creado!");
    setUltimoEventoId(data.id);

    // Limpiar el formulario para cargar el siguiente evento
    setNombre("");
    setDescripcion("");
    setFecha("");
    setUbicacion("");
    setPortadaUrl("");
    setPrecioIndividual(String(DEFAULTS.precioIndividual));
    setPrecioPack3(String(DEFAULTS.precioPack3));
    setPrecioPaqueteCompleto(String(DEFAULTS.precioPaqueteCompleto));
    setPublicado(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-xl font-semibold text-foreground">Crear evento</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Completa los datos del evento. Los precios ya vienen con los valores más comunes; ajústalos si este evento
        cobra distinto.
      </p>

      {ultimoEventoId && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Evento creado con id: <code className="font-mono text-xs">{ultimoEventoId}</code>
          <br />
          Guárdalo — lo vas a necesitar para subir las fotos de este evento.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre del evento *</Label>
          <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ubicacion">Ubicación</Label>
            <Input id="ubicacion" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="portada">URL de portada</Label>
          <Input
            id="portada"
            placeholder="https://..."
            value={portadaUrl}
            onChange={(e) => setPortadaUrl(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-4">
          <p className="mb-3 text-sm font-medium text-foreground">Precios (en COP)</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="precioIndividual" className="text-xs">
                Individual
              </Label>
              <Input
                id="precioIndividual"
                type="number"
                min={0}
                value={precioIndividual}
                onChange={(e) => setPrecioIndividual(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioPack3" className="text-xs">
                Pack de 3
              </Label>
              <Input
                id="precioPack3"
                type="number"
                min={0}
                value={precioPack3}
                onChange={(e) => setPrecioPack3(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioPaqueteCompleto" className="text-xs">
                Paquete completo
              </Label>
              <Input
                id="precioPaqueteCompleto"
                type="number"
                min={0}
                value={precioPaqueteCompleto}
                onChange={(e) => setPrecioPaqueteCompleto(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">Publicado</p>
            <p className="text-xs text-muted-foreground">
              Solo los eventos publicados aparecen en el catálogo público.
            </p>
          </div>
          <Switch checked={publicado} onCheckedChange={setPublicado} />
        </div>

        <Button type="submit" className="w-full" disabled={guardando}>
          {guardando ? "Guardando..." : "Crear evento"}
        </Button>
      </form>
    </div>
  );
}