import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, CreditCard, Mail, User } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatCOP, PRICES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — CheerShot" },
      { name: "description", content: "Completa tu compra y recibe tus fotos en el correo." },
      { property: "og:title", content: "Checkout — CheerShot" },
      { property: "og:description", content: "Pago seguro de fotografías del evento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
});

function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = schema.safeParse({ name, email });
    if (!res.success) {
      const fe: typeof errors = {};
      for (const err of res.error.issues) fe[err.path[0] as "name" | "email"] = err.message;
      setErrors(fe);
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      const successEmail = email;
      clear();
      navigate({ to: "/success", search: { email: successEmail } });
    }, 1400);
  };

  if (items.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div>
          <p className="font-display text-2xl">Tu carrito está vacío</p>
          <p className="mt-2 text-sm text-muted-foreground">Añade fotos o un paquete para continuar.</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver a eventos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="bg-gradient-hero px-4 py-6 text-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={() => history.back()} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/25">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Paso final</p>
            <h1 className="font-display text-2xl">Completa tu compra</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-2xl gap-4 px-4 py-6">
        {/* Order summary */}
        <section className="rounded-3xl border bg-card p-5 shadow-card">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Resumen</h2>
          <ul className="divide-y">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between py-3 text-sm">
                <span className="pr-3">
                  {item.kind === "photo" && <>Foto #{item.photo.bib} · {item.photo.team}</>}
                  {item.kind === "pack3" && <>Pack de 3 fotos</>}
                  {item.kind === "full" && <>Paquete Completo (todas las fotos + video)</>}
                </span>
                <span className="font-semibold">
                  {formatCOP(item.kind === "photo" ? PRICES.single : item.kind === "pack3" ? PRICES.pack3 : PRICES.full)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-display text-2xl">{formatCOP(total)}</span>
          </div>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl border bg-card p-5 shadow-card">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Datos de contacto</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1.5 flex items-center gap-1.5 text-xs">
                <User className="h-3.5 w-3.5" /> Nombre completo
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María González" maxLength={100} className="h-11" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" /> Correo electrónico
                <span className="ml-1 text-brand">*</span>
              </Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" maxLength={255} className="h-11" />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Enviaremos tus archivos originales a este correo.
              </p>
            </div>
          </div>

          <Button type="submit" disabled={loading} size="lg" className="mt-6 w-full bg-gradient-hype text-white hover:opacity-95">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Procesando pago...
              </span>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar {formatCOP(total)} con Pasarela Online
              </>
            )}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Pago 100% seguro · SSL cifrado
          </p>
        </form>
      </div>
    </div>
  );
}
