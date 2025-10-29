import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";

export const attendance = Router();

/**
 * POST /api/memorials/:slug/attendance
 * Offentlig påmelding: { name, email, plusOne:boolean, allergies?:string, notes?:string }
 */
attendance.post("/memorials/:slug/attendance", async (req, res) => {
    const slug = String(req.params.slug);
    const { name, email, plusOne, allergies, notes } = req.body ?? {};

    // Validering
    const errors: Record<string, string> = {};
    if (!name || String(name).trim().length < 2) errors.name = "Navn må være minst 2 tegn.";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) errors.email = "Ugyldig e-post.";
    if (typeof plusOne !== "boolean") errors.plusOne = "plusOne må være true/false.";

    if (Object.keys(errors).length) {
        return res.status(400).json({ ok: false, errors });
    }

    // Finn memorial
    const mem = await prisma.memorial.findUnique({ where: { slug } });
    if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

    // Lagre påmelding
    const item = await prisma.attendance.create({
        data: {
            memorialId: mem.id,
            name: String(name).trim(),
            email: String(email).trim().toLowerCase(),
            plusOne: Boolean(plusOne),
            allergies: allergies ? String(allergies).trim() : null,
            notes: notes ? String(notes).trim() : null,
        },
    });

    return res.status(201).json({ ok: true, item });
});

/**
 * (Admin) GET /api/memorials/:slug/attendance
 * Liste over påmeldinger
 */
attendance.get("/memorials/:slug/attendance", requireAdmin, async (req, res) => {
    const slug = String(req.params.slug);
    const mem = await prisma.memorial.findUnique({ where: { slug } });
    if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

    const items = await prisma.attendance.findMany({
        where: { memorialId: mem.id },
        orderBy: { createdAt: "desc" },
    });

    res.json({ ok: true, items });
});

/**
 * (Admin) GET /api/memorials/:slug/attendance.csv
 * CSV-eksport. Kolonner: name,email,plusOne,guests,allergies,notes,createdAt
 * guests = 1 + (plusOne ? 1 : 0)
 */
attendance.get("/memorials/:slug/attendance.csv", requireAdmin, async (req, res) => {
    const slug = String(req.params.slug);
    const mem = await prisma.memorial.findUnique({ where: { slug } });
    if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

    const items = await prisma.attendance.findMany({
        where: { memorialId: mem.id },
        orderBy: { createdAt: "asc" },
    });

    const header = ["name", "email", "plusOne", "guests", "allergies", "notes", "createdAt"];

    const csvEscape = (v: string) => `"${v.replaceAll(`"`, `""`)}"`;
    const lines = [header.join(",")].concat(
        items.map((i) => {
            const guests = 1 + (i.plusOne ? 1 : 0);
            return [
                i.name,
                i.email,
                String(Boolean(i.plusOne)),
                String(guests),
                i.allergies ?? "",
                i.notes?.replaceAll(",", ";") ?? "",
                i.createdAt.toISOString(),
            ]
                .map((v) => csvEscape(v))
                .join(",");
        })
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}-attendance.csv"`);
    res.send(lines.join("\n"));
});

/**
 * (Valgfritt) offentlig oppsummering
 * GET /api/memorials/:slug/attendance/summary  -> { total, entries }
 * total = antall personer inkl. +1
 */
attendance.get("/memorials/:slug/attendance/summary", async (req, res) => {
    const slug = String(req.params.slug);
    const mem = await prisma.memorial.findUnique({ where: { slug }, select: { id: true } });
    if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

    const items = await prisma.attendance.findMany({
        where: { memorialId: mem.id },
        select: { plusOne: true },
    });

    const total = items.reduce((sum, a) => sum + 1 + (a.plusOne ? 1 : 0), 0);
    res.json({ ok: true, total, entries: items.length });
});