import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";

export const memorials = Router();

// Liste (offentlig) – paginert
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
            // kort oppsummering av seremoni + minnestund
            ceremony: { select: { dateTime: true, venue: true, address: true } },
            reception: { select: { dateTime: true, venue: true, address: true } },
        },
    });
    res.json({ ok: true, items });
});

// Hent én (offentlig)
memorials.get("/memorials/:slug", async (req, res) => {
    const item = await prisma.memorial.findUnique({
        where: { slug: String(req.params.slug) },
        include: {
            ceremony: true,
            reception: true, // <— NY
            notes: { where: { approved: true }, orderBy: { createdAt: "desc" } },
        },
    });
    if (!item) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, item });
});

// Opprett (admin)
memorials.post("/memorials", requireAdmin, async (req, res) => {
    const { slug, name, birthDate, deathDate, bio, imageUrl, obituaryNote } = req.body ?? {};
    if (!slug || !name) return res.status(400).json({ ok: false, error: "slug and name required" });
    try {
        const created = await prisma.memorial.create({
            data: {
                slug,
                name,
                birthDate: birthDate ? new Date(birthDate) : undefined,
                deathDate: deathDate ? new Date(deathDate) : undefined,
                bio,
                imageUrl,
                obituaryNote, // <— NY
            },
        });
        res.status(201).json({ ok: true, item: created });
    } catch (e: any) {
        res.status(400).json({ ok: false, error: e.message });
    }
});

// Oppdater (admin)
memorials.put("/memorials/:slug", requireAdmin, async (req, res) => {
    const { name, birthDate, deathDate, bio, imageUrl, obituaryNote } = req.body ?? {};
    try {
        const updated = await prisma.memorial.update({
            where: { slug: String(req.params.slug) },
            data: {
                name,
                birthDate: birthDate ? new Date(birthDate) : undefined,
                deathDate: deathDate ? new Date(deathDate) : undefined,
                bio,
                imageUrl,
                obituaryNote, // <— NY
            },
        });
        res.json({ ok: true, item: updated });
    } catch (e: any) {
        res.status(400).json({ ok: false, error: e.message });
    }
});

// Slett (admin)
memorials.delete("/memorials/:slug", requireAdmin, async (req, res) => {
  try {
    await prisma.memorial.delete({ where: { slug: String(req.params.slug) } });
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// Ceremony upsert (admin)
memorials.put("/memorials/:slug/ceremony", requireAdmin, async (req, res) => {
  const slug = String(req.params.slug);
  const mem = await prisma.memorial.findUnique({ where: { slug } });
  if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

  const { dateTime, venue, address, mapUrl, livestream } = req.body ?? {};
  const item = await prisma.ceremony.upsert({
    where: { memorialId: mem.id },
    update: {
      dateTime: dateTime ? new Date(dateTime) : undefined,
      venue, address, mapUrl, livestream,
    },
    create: {
      memorialId: mem.id,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      venue: venue ?? "Ukjent",
      address, mapUrl, livestream,
    },
  });
  res.json({ ok: true, item });
});

// Reception (minnestund) upsert (admin)
memorials.put("/memorials/:slug/reception", requireAdmin, async (req, res) => {
    const slug = String(req.params.slug);
    const mem = await prisma.memorial.findUnique({ where: { slug } });
    if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

    const { dateTime, venue, address, mapUrl, welcomeScope, wishes } = req.body ?? {};

    if (!dateTime || !venue) {
        return res.status(400).json({ ok: false, error: "dateTime and venue are required" });
    }

    const allowed = ["OPEN", "FAMILY", "PRIVATE"] as const;
    const scope = (welcomeScope ?? "OPEN").toUpperCase();
    if (!allowed.includes(scope as any)) {
        return res.status(400).json({ ok: false, error: "welcomeScope must be OPEN|FAMILY|PRIVATE" });
    }

    const item = await prisma.reception.upsert({
        where: { memorialId: mem.id },
        update: {
            dateTime: new Date(dateTime),
            venue,
            address,
            mapUrl,
            welcomeScope: scope as any,
            wishes,
        },
        create: {
            memorialId: mem.id,
            dateTime: new Date(dateTime),
            venue,
            address,
            mapUrl,
            welcomeScope: scope as any,
            wishes,
        },
    });

    res.json({ ok: true, item });
});