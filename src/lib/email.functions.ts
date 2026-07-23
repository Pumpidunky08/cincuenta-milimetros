import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  total: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        label: z.string().max(200),
        price: z.number().nonnegative(),
      }),
    )
    .min(1)
    .max(50),
});

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

export const sendOrderConfirmation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const from = process.env.RESEND_FROM ?? "50Milimetros <onboarding@resend.dev>";

    const itemsHtml = data.items
      .map(
        (i) =>
          `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${i.label}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${formatCOP(i.price)}</td></tr>`,
      )
      .join("");

    const html = `<!doctype html>
<html><body style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
    <div style="background:#3D5F92;color:#fff;padding:20px 24px;">
      <h1 style="margin:0;font-size:20px;">¡Gracias por tu compra, ${data.name}!</h1>
      <p style="margin:6px 0 0;opacity:.85;font-size:13px;">Confirmación de pedido · 50Milimetros</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 12px;font-size:14px;color:#333;">Recibimos tu pedido correctamente. En breve te enviaremos los archivos originales en alta resolución a este mismo correo.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;margin-top:16px;">
        ${itemsHtml}
        <tr><td style="padding:12px 0 0;font-weight:700;">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px;">${formatCOP(data.total)}</td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#666;">Si tienes alguna duda, responde a este correo.</p>
    </div>
  </div>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [data.email],
        subject: "Confirmación de tu pedido · 50Milimetros",
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`Resend request failed [${res.status}]: ${body}`);
      throw new Error(`Email send failed [${res.status}]`);
    }

    return { sent: true };
  });
