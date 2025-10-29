import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";

export const attendance = Router();

// Myk kapasitet (kan flyttes til DB senere, f.eks. Memorial.capacity)
const CAPACITY = 60;

/** Hjelpere */
function toBoolean(v: unknown): boolean {
    if (typeof v === "boolean") return v;
    const s = String(v ?? "").toLowerCase().trim();
    return s === "true" || s === "1" || s === "on" || s === "yes" || s === "ja";
}

function isEmail(s: unknown): boolean {
    return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function csvEscape(v: string): string {
    // erstatt CR/LF og doble anførselstegn
    return `"${v.replaceAll('"', '""').replace(/\r?\n/g, " ")}"`;
}

/**
 * POST /api/memorials/:slug/attendance
 * Offentlig påmelding: { name, email, plusOne:boolean|("true"/"1"/"on"), allergies?:string, notes?:string }
 * Ved overkapasitet markeres raden som waitlisted=true (ingen hard blokkering).
 */
attendance.post("/memorials/:slug/attendance", async (req, res) => {
    try {
        const slug = String(req.params.slug);
        const { name, email, plusOne, allergies, notes } = req.body ?? {};

        const errors: Record<string, string> = {};
        const nameStr = String(name ?? "").trim();
        const emailStr = String(email ?? "").trim().toLowerCase();
        const plusOneBool = toBoolean(plusOne);

        if (nameStr.length < 2) errors.name = "Navn må være minst 2 tegn.";
        if (!isEmail(emailStr)) errors.email = "Ugyldig e-post.";
        if (plusOne === undefined) errors.plusOne = "plusOne må være true/false.";

        if (Object.keys(errors).length) {
            return res.status(400).json({ ok: false, errors });
        }

        const mem = await prisma.memorial.findUnique({ where: { slug } });
        if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

        // Tell bekreftede (ikke venteliste) mot kapasitet
        const confirmed = await prisma.attendance.findMany({
            where: { memorialId: mem.id, waitlisted: false },
            select: { plusOne: true },
        });
        const totalConfirmed = confirmed.reduce((sum, a) => sum + 1 + (a.plusOne ? 1 : 0), 0);
        const incoming = 1 + (plusOneBool ? 1 : 0);
        const willExceed = totalConfirmed + incoming > CAPACITY;

        const item = await prisma.attendance.create({
            data: {
                memorialId: mem.id,
                name: nameStr,
                email: emailStr,
                plusOne: plusOneBool,
                allergies: allergies ? String(allergies).trim() : null,
                notes: notes ? String(notes).trim() : null,
                waitlisted: willExceed, // 👈 venteliste ved overkapasitet
            },
            select: { id: true, waitlisted: true },
        });

        return res.status(201).json({
            ok: true,
            item,
            waitlisted: item.waitlisted,
            message: item.waitlisted
                ? "Arrangementet er fulltegnet, men interessen din er registrert. Du får beskjed hvis det blir ledig kapasitet."
                : "Påmeldingen er registrert.",
        });
    } catch (err) {
        console.error("POST /attendance failed:", err);
        return res.status(500).json({ ok: false, error: "Serverfeil" });
    }
});

/**
 * (Admin) GET /api/memorials/:slug/attendance
 * Liste over påmeldinger
 */
attendance.get("/memorials/:slug/attendance", requireAdmin, async (req, res) => {
    try {
        const slug = String(req.params.slug);
        const mem = await prisma.memorial.findUnique({ where: { slug } });
        if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

        const items = await prisma.attendance.findMany({
            where: { memorialId: mem.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                plusOne: true,
                allergies: true,
                notes: true,
                waitlisted: true,
                createdAt: true,
            },
        });

        res.json({ ok: true, items });
    } catch (err) {
        console.error("GET /attendance failed:", err);
        return res.status(500).json({ ok: false, error: "Serverfeil" });
    }
});

/**
 * (Admin) GET /api/memorials/:slug/attendance.csv
 * CSV: name,email,plusOne,guests,allergies,notes,waitlisted,createdAt
 * guests = 1 + (plusOne ? 1 : 0)
 */
attendance.get("/memorials/:slug/attendance.csv", requireAdmin, async (req, res) => {
    try {
        const slug = String(req.params.slug);
        const mem = await prisma.memorial.findUnique({ where: { slug } });
        if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

        const items = await prisma.attendance.findMany({
            where: { memorialId: mem.id },
            orderBy: { createdAt: "asc" },
            select: {
                name: true,
                email: true,
                plusOne: true,
                allergies: true,
                notes: true,
                waitlisted: true,
                createdAt: true,
            },
        });

        const header = ["name", "email", "plusOne", "guests", "allergies", "notes", "waitlisted", "createdAt"];
        const lines = [header.join(",")].concat(
            items.map((i) => {
                const guests = 1 + (i.plusOne ? 1 : 0);
                return [
                    i.name,
                    i.email,
                    String(i.plusOne),
                    String(guests),
                    i.allergies ?? "",
                    i.notes ?? "",
                    String(i.waitlisted),
                    i.createdAt.toISOString(),
                ]
                    .map((v) => csvEscape(v))
                    .join(",");
            }),
        );

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${slug}-attendance.csv"`);
        res.send(lines.join("\n"));
    } catch (err) {
        console.error("GET /attendance.csv failed:", err);
        return res.status(500).json({ ok: false, error: "Serverfeil" });
    }
});

/**
 * Offentlig oppsummering
 * GET /api/memorials/:slug/attendance/summary
 * -> { ok, totalConfirmed, totalWaitlisted, entriesConfirmed, entriesWaitlisted, capacity }
 */
attendance.get("/memorials/:slug/attendance/summary", async (req, res) => {
    try {
        const slug = String(req.params.slug);
        const mem = await prisma.memorial.findUnique({ where: { slug }, select: { id: true } });
        if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

        const items = await prisma.attendance.findMany({
            where: { memorialId: mem.id },
            select: { plusOne: true, waitlisted: true },
        });

        const confirmed = items.filter(i => !i.waitlisted);
        const waitlisted = items.filter(i => i.waitlisted);

        const totalConfirmed = confirmed.reduce((sum, a) => sum + 1 + (a.plusOne ? 1 : 0), 0);
        const totalWaitlisted = waitlisted.reduce((sum, a) => sum + 1 + (a.plusOne ? 1 : 0), 0);

        res.json({
            ok: true,
            totalConfirmed,
            totalWaitlisted,
            entriesConfirmed: confirmed.length,
            entriesWaitlisted: waitlisted.length,
            capacity: CAPACITY,
        });
    } catch (err) {
        console.error("GET /attendance/summary failed:", err);
        return res.status(500).json({ ok: false, error: "Serverfeil" });
    }
});