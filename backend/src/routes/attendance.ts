import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";


export const attendance = Router();

// Myk kapasitet (kan flyttes til DB senere)
const CAPACITY = Number(process.env.CAPACITY ?? 118);

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
    return `"${v.replaceAll('"', '""').replace(/\r?\n/g, " ")}"`;
}

/**
 * POST /api/memorials/:slug/attendance
 * Offentlig påmelding: { name, email, plusOne, allergies?, notes? }
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

        const totalConfirmed = confirmed.reduce(
            (sum: number, a: { plusOne: boolean }) => sum + 1 + (a.plusOne ? 1 : 0),
            0
        );

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
                waitlisted: willExceed,
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

        const header = [
            "name",
            "email",
            "plusOne",
            "guests",
            "allergies",
            "notes",
            "waitlisted",
            "createdAt",
        ];

        const lines = [header.join(",")].concat(
            items.map(
                (i: {
                    name: string;
                    email: string;
                    plusOne: boolean;
                    allergies: string | null;
                    notes: string | null;
                    waitlisted: boolean;
                    createdAt: Date;
                }) => {
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
                }
            )
        );

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${slug}-attendance.csv"`);
        res.send(lines.join("\n"));
    } catch (err) {
        console.error("GET /attendance.csv failed:", err);
        return res.status(500).json({ ok: false, error: "Serverfeil" });
    }
});
// Admin: Reconcile/promote waitlisted entries up to capacity
attendance.post("/memorials/:slug/attendance/reconcile", requireAdmin, async (req, res) => {
    try {
        const slug = String(req.params.slug);

        const mem = await prisma.memorial.findUnique({
            where: { slug },
            select: { id: true },
        });
        if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

        // 1) Finn confirmed totalt (antall personer inkl. +1)
        const confirmedRows = await prisma.attendance.findMany({
            where: { memorialId: mem.id, waitlisted: false },
            select: { plusOne: true },
        });
        const totalConfirmed = confirmedRows.reduce((sum, r) => sum + (r.plusOne ? 2 : 1), 0);

        // 2) Beregn ledige plasser
        let remaining = Math.max(0, Number(process.env.CAPACITY ?? 60) - totalConfirmed);
        if (remaining === 0) {
            return res.json({ ok: true, promoted: 0, remaining });
        }

        // 3) Hent venteliste i kronologisk rekkefølge
        const waitlisted = await prisma.attendance.findMany({
            where: { memorialId: mem.id, waitlisted: true },
            orderBy: { createdAt: "asc" },
            select: { id: true, plusOne: true },
        });

        // 4) Promoter så langt vi har kapasitet
        let promoted = 0;
        for (const row of waitlisted) {
            const needed = row.plusOne ? 2 : 1;
            if (needed <= remaining) {
                await prisma.attendance.update({
                    where: { id: row.id },
                    data: { waitlisted: false },
                });
                remaining -= needed;
                promoted++;
                if (remaining === 0) break;
            } else {
                break;
            }
        }

        return res.json({ ok: true, promoted, remaining });
    } catch (e: any) {
        console.error("POST /memorials/:slug/attendance/reconcile", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
});

/**
 * Offentlig oppsummering
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

        const confirmed = items.filter((i: { waitlisted: boolean }) => !i.waitlisted);
        const waitlisted = items.filter((i: { waitlisted: boolean }) => i.waitlisted);

        const totalConfirmed = confirmed.reduce(
            (sum: number, a: { plusOne: boolean }) => sum + 1 + (a.plusOne ? 1 : 0),
            0
        );
        const totalWaitlisted = waitlisted.reduce(
            (sum: number, a: { plusOne: boolean }) => sum + 1 + (a.plusOne ? 1 : 0),
            0
        );

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