import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";

export const attendance = Router();

// Opprett RSVP (offentlig)
attendance.post("/memorials/:slug/attendance", async (req, res) => {
  const slug = String(req.params.slug);
  const { name, email, count, notes } = req.body ?? {};
  if (!name || !email) return res.status(400).json({ ok: false, error: "name and email required" });
  const mem = await prisma.memorial.findUnique({ where: { slug } });
  if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

  const item = await prisma.attendance.create({
    data: {
      memorialId: mem.id,
      name,
      email,
      count: Number(count ?? 1),
      notes,
    },
  });
  res.status(201).json({ ok: true, item });
});

// Admin: list
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

// Admin: CSV eksport
attendance.get("/memorials/:slug/attendance.csv", requireAdmin, async (req, res) => {
  const slug = String(req.params.slug);
  const mem = await prisma.memorial.findUnique({ where: { slug } });
  if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

  const items = await prisma.attendance.findMany({
    where: { memorialId: mem.id },
    orderBy: { createdAt: "asc" },
  });

  const header = ["name", "email", "count", "notes", "createdAt"];
  const lines = [header.join(",")].concat(
    items.map(i =>
      [i.name, i.email, String(i.count), (i.notes ?? "").replaceAll(",", ";"), i.createdAt.toISOString()]
        .map((v) => `"${v.replaceAll('"', '""')}"`)
        .join(",")
    )
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${slug}-attendance.csv"`);
  res.send(lines.join("\n"));
});
