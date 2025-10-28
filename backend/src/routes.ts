import { Router } from "express";
import memorials from "./memorials.js";
import upload from "./upload.js";

// NYTT:
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { requireAdmin } from "../middleware/admin.js"; // pass på at stien stemmer (../middleware/admin.js)

const router = Router();

router.use(memorials);
router.use(upload);

// ---------- Eksisterende endepunkter ----------

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

    if (process.env.RESEND_API_KEY) {
        try {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: "Etterglod <noreply@etterglod.no>",
                to: [process.env.NOTIFY_TO ?? "eiriksat@gmail.com"],
                subject: `Ny kontaktforespørsel: ${name}`,
                text: `Navn: ${name}\nE-post: ${email}\n\nMelding:\n${message}`,
            });
        } catch (e) {
            console.error("Resend error:", e);
        }
    }

    return res.status(201).json({
        ok: true,
        received: { name, email, message },
        ts: new Date().toISOString(),
    });
});

// ---------- NYTT: bildeopplasting ----------

// Multer-lagring til ./uploads med trygge filnavn
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.resolve("uploads")),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "");
        const base = crypto.randomBytes(8).toString("hex");
        cb(null, `${Date.now()}-${base}${ext}`);
    },
});

// Tillat kun bildeformater + 5MB grense
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    cb(ok ? null : new Error("Ugyldig filtype (tillat: jpeg, png, webp, gif)"), ok);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /api/upload/image  (form field: "file")
// Krever Authorization: Bearer <ADMIN_TOKEN>
router.post("/upload/image", requireAdmin, upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ ok: false, error: "Mangler fil" });
    const base = process.env.PUBLIC_BASE_URL || "http://localhost:4000";
    const url = `${base}/uploads/${req.file.filename}`;
    res.status(201).json({ ok: true, url, filename: req.file.filename });
});

export default router;