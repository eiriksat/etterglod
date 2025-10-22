import { Router } from "express";

const router = Router();

// GET /api/health
router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "etterglod-api" });
});

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// POST /api/contact  { name, email, message }
router.post("/contact", async (req, res) => {
  const { name, email, message } = req.body ?? {};
  const errors: Record<string, string> = {};

  if (!name || String(name).trim().length < 2) errors.name = "Navn må være minst 2 tegn.";
  if (!email || !isEmail(String(email))) errors.email = "Ugyldig e-postadresse.";
  if (!message || String(message).trim().length < 5) errors.message = "Meldingen må være minst 5 tegn.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ ok: false, errors });
  }

  // Valgfritt: send e-post via Resend hvis API-nøkkel finnes
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import("resend"); // dynamisk import for å unngå krav om install hvis ikke i bruk
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Etterglod <noreply@etterglod.no>",
        to: [process.env.NOTIFY_TO ?? "eiriksat@gmail.com"],
        subject: `Ny kontaktforespørsel: ${name}`,
        text: `Navn: ${name}\nE-post: ${email}\n\nMelding:\n${message}`,
      });
    } catch (e) {
      // Logger, men feiler ikke forespørselen til brukeren
      console.error("Resend error:", e);
    }
  }

  return res.status(201).json({
    ok: true,
    received: { name, email, message },
    ts: new Date().toISOString(),
  });
});

export default router;
