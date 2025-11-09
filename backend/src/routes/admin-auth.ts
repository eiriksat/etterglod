import { Router } from "express";
import { signAdminJwt, requireAdminJwt } from "../middleware/jwt.js";

export const adminAuth = Router();

/** Enkel innlogging: sammenligner passord mot ADMIN_PASSWORD secret */
adminAuth.post("/admin/login", (req, res) => {
    const { password } = req.body ?? {};
    const ok = typeof password === "string" && password === process.env.ADMIN_PASSWORD;
    if (!ok) return res.status(401).json({ ok: false, error: "Invalid credentials" });

    const token = signAdminJwt("admin");
    return res.json({ ok: true, token });
});

/** Test-route som krever admin-JWT */
adminAuth.get("/admin/ping", requireAdminJwt, (_req, res) => {
    res.json({ ok: true, message: "admin ok" });
});