import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";

export const memorials = Router();

/** Utils */
const toNullableDate = (v: unknown): Date | null =>
    v ? new Date(String(v)) : null;

/** -------------------------
 *  Liste (offentlig) – paginert
 *  ------------------------ */
memorials.get("/memorials", async (req, res) => {
    const take = Math.min(Number(req.query.take ?? 20), 100);
    const skip = Number(req.query.skip ?? 0);

    const items = await prisma.memorial.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            slug: true,
            name: true,
            birthDate: true,
            deathDate: true,
            imageUrl: true,
            createdAt: true,
            ceremony: { select: { dateTime: true, venue: true, address: true } },
            reception: { select: { dateTime: true, venue: true, address: true } },
        },
    });
    res.json({ ok: true, items });
});

/** -------------------------
 *  Hent én (offentlig)
 *  ------------------------ */
memorials.get("/memorials/:slug", async (req, res) => {
    const item = await prisma.memorial.findUnique({
        where: { slug: String(req.params.slug) },
        include: {
            ceremony: true,
            reception: true,
            notes: { where: { approved: true }, orderBy: { createdAt: "desc" } },
        },
    });
    if (!item) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, item });
});

/** -------------------------
 *  Opprett (admin)
 *  ------------------------ */
memorials.post("/memorials", requireAdmin, async (req, res) => {
    const { slug, name, birthDate, deathDate, bio, imageUrl, obituaryNote } = req.body ?? {};
    if (!slug || !name) {
        return res.status(400).json({ ok: false, error: "slug and name required" });
    }

    try {
        const created = await prisma.memorial.create({
            data: {
                slug,
                name,
                // NB: for create kan vi sette null eksplisitt
                birthDate: toNullableDate(birthDate),
                deathDate: toNullableDate(deathDate),
                bio: bio ?? null,
                imageUrl: imageUrl ?? null,
                obituaryNote: obituaryNote ?? null,
            },
        });
        res.status(201).json({ ok: true, item: created });
    } catch (e: any) {
        res.status(400).json({ ok: false, error: e.message });
    }
});

/** -------------------------
 *  Oppdater (admin)
 *  ------------------------ */
memorials.put("/memorials/:slug", requireAdmin, async (req, res) => {
    const slug = String(req.params.slug);
    const { name, birthDate, deathDate, bio, imageUrl, obituaryNote } = req.body ?? {};

    try {
        // Med exactOptionalPropertyTypes må vi *utelate* felt som ikke skal endres
        const data = {
            ...(name !== undefined ? { name } : {}),
            ...(birthDate !== undefined ? { birthDate: toNullableDate(birthDate) } : {}),
            ...(deathDate !== undefined ? { deathDate: toNullableDate(deathDate) } : {}),
            ...(bio !== undefined ? { bio: bio ?? null } : {}),
            ...(imageUrl !== undefined ? { imageUrl: imageUrl ?? null } : {}),
            ...(obituaryNote !== undefined ? { obituaryNote: obituaryNote ?? null } : {}),
        };

        const updated = await prisma.memorial.update({
            where: { slug },
            data,
        });

        res.json({ ok: true, item: updated });
    } catch (e: any) {
        res.status(400).json({ ok: false, error: e.message });
    }
});

/** -------------------------
 *  Slett (admin)
 *  ------------------------ */
memorials.delete("/memorials/:slug", requireAdmin, async (req, res) => {
    try {
        await prisma.memorial.delete({ where: { slug: String(req.params.slug) } });
        res.json({ ok: true });
    } catch (e: any) {
        res.status(400).json({ ok: false, error: e.message });
    }
});

/** -------------------------
 *  Ceremony upsert (admin)
 *  ------------------------ */
memorials.put("/memorials/:slug/ceremony", requireAdmin, async (req, res) => {
    const slug = String(req.params.slug);
    const mem = await prisma.memorial.findUnique({ where: { slug } });
    if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

    const { dateTime, venue, address, mapUrl, livestream } = req.body ?? {};

    // For upsert.update må vi utelate felt som er undefined
    const updateData = {
        ...(dateTime !== undefined ? { dateTime: new Date(dateTime) } : {}),
        ...(venue !== undefined ? { venue } : {}),
        ...(address !== undefined ? { address: address ?? null } : {}),
        ...(mapUrl !== undefined ? { mapUrl: mapUrl ?? null } : {}),
        ...(livestream !== undefined ? { livestream: livestream ?? null } : {}),
    };

    const createData = {
        memorialId: mem.id,
        dateTime: dateTime ? new Date(dateTime) : new Date(), // fallback hvis ikke gitt
        venue: venue ?? "Ukjent",
        address: address ?? null,
        mapUrl: mapUrl ?? null,
        livestream: livestream ?? null,
    };

    const item = await prisma.ceremony.upsert({
        where: { memorialId: mem.id },
        update: updateData,
        create: createData,
    });

    res.json({ ok: true, item });
});

/** -------------------------
 *  Reception (minnestund) upsert (admin)
 *  ------------------------ */
memorials.put("/memorials/:slug/reception", requireAdmin, async (req, res) => {
    const slug = String(req.params.slug);
    const mem = await prisma.memorial.findUnique({ where: { slug } });
    if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

    const { dateTime, venue, address, mapUrl, welcomeScope, wishes } = req.body ?? {};

    if (!dateTime || !venue) {
        return res.status(400).json({ ok: false, error: "dateTime and venue are required" });
    }

    const allowed = ["OPEN", "FAMILY", "PRIVATE"] as const;
    const scope = String(welcomeScope ?? "OPEN").toUpperCase();
    if (!allowed.includes(scope as any)) {
        return res.status(400).json({ ok: false, error: "welcomeScope must be OPEN|FAMILY|PRIVATE" });
    }

    const item = await prisma.reception.upsert({
        where: { memorialId: mem.id },
        update: {
            dateTime: new Date(dateTime),
            venue,
            ...(address !== undefined ? { address: address ?? null } : {}),
            ...(mapUrl !== undefined ? { mapUrl: mapUrl ?? null } : {}),
            welcomeScope: scope as any,
            ...(wishes !== undefined ? { wishes: wishes ?? null } : {}),
        },
        create: {
            memorialId: mem.id,
            dateTime: new Date(dateTime),
            venue,
            address: address ?? null,
            mapUrl: mapUrl ?? null,
            welcomeScope: scope as any,
            wishes: wishes ?? null,
        },
    });

    res.json({ ok: true, item });
});

/** -------------------------
 *  Offentlig: slå opp shortCode → slug
 *  ------------------------ */
memorials.get("/short/:code", async (req, res) => {
    try {
        const code = String(req.params.code).trim().toLowerCase();
        const m = await prisma.memorial.findUnique({
            where: { shortCode: code },
            select: { slug: true },
        });
        if (!m) return res.status(404).json({ ok: false, error: "Not found" });
        return res.json({ ok: true, slug: m.slug });
    } catch (e) {
        console.error("GET /short/:code", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
});

/** -------------------------
 *  Admin: PATCH shortCode for en memorial
 *  ------------------------ */
memorials.patch("/memorials/:slug/shortcode", requireAdmin, async (req, res) => {
    try {
        const slug = String(req.params.slug);
        const code = String(req.body?.shortCode ?? "").trim().toLowerCase();

        if (!/^[a-z0-9-]{3,32}$/.test(code)) {
            return res.status(400).json({
                ok: false,
                error: "shortCode må være 3–32 tegn og bare inneholde a–z, 0–9 og bindestrek",
            });
        }

        const mem = await prisma.memorial.findUnique({ where: { slug }, select: { id: true } });
        if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

        const updated = await prisma.memorial.update({
            where: { id: mem.id },
            data: { shortCode: code },
            select: { slug: true, shortCode: true },
        });

        return res.json({ ok: true, item: updated });
    } catch (e: any) {
        if ((e as any)?.code === "P2002") {
            return res.status(409).json({ ok: false, error: "shortCode er allerede i bruk" });
        }
        console.error("PATCH /memorials/:slug/shortcode", e);
        return res.status(500).json({ ok: false, error: "Server error" });
    }
});