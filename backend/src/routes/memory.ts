import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../middleware/admin.js";

export const memory = Router();

// Offentlig: opprett (pending=ikke godkjent)
memory.post("/memorials/:slug/memory", async (req, res) => {
  const slug = String(req.params.slug);
  const { author, text } = req.body ?? {};
  if (!author || !text) return res.status(400).json({ ok: false, error: "author and text required" });

  const mem = await prisma.memorial.findUnique({ where: { slug } });
  if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

  const item = await prisma.memoryNote.create({
    data: { memorialId: mem.id, author, text, approved: false },
  });
  res.status(201).json({ ok: true, item });
});

// Offentlig: list godkjente
memory.get("/memorials/:slug/memory", async (req, res) => {
  const slug = String(req.params.slug);
  const mem = await prisma.memorial.findUnique({ where: { slug } });
  if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

  const items = await prisma.memoryNote.findMany({
    where: { memorialId: mem.id, approved: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ ok: true, items });
});

// Admin: ventende (ikke godkjente)
memory.get("/memorials/:slug/memory/pending", requireAdmin, async (req, res) => {
  const slug = String(req.params.slug);
  const mem = await prisma.memorial.findUnique({ where: { slug } });
  if (!mem) return res.status(404).json({ ok: false, error: "Memorial not found" });

  const items = await prisma.memoryNote.findMany({
    where: { memorialId: mem.id, approved: false },
    orderBy: { createdAt: "asc" },
  });
  res.json({ ok: true, items });
});

// Admin: godkjenn
memory.post("/memorials/:slug/memory/:id/approve", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const updated = await prisma.memoryNote.update({ where: { id }, data: { approved: true } });
  res.json({ ok: true, item: updated });
});

// Admin: slett
memory.delete("/memorials/:slug/memory/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  await prisma.memoryNote.delete({ where: { id } });
  res.json({ ok: true });
});
