import { Router } from "express";
import { signAdminJwt, requireAdminJwt } from "../middleware/jwt.js";

export const adminAuth = Router();

/** POST /api/admin/auth/login { email, password } -> { token } */
adminAuth.post("/admin/auth/login", async (req, res) => {
    const { email, password } = req.body ?? {};
    const okEmail = String(email || "").toLowerCase().trim() === String(process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const okPass  = String(password || "") === String(process.env.ADMIN_PASSWORD || "");

    if (!okEmail || !okPass) {
        return res.status(401).json({ ok: false, error: "Invalid credentials" });
    }

    const token = signAdminJwt({ email });
    return res.json({ ok: true, token });
});

/** En enkel helsesjekk for beskyttede kall */
adminAuth.get("/admin/ping", requireAdminJwt, (req, res) => {
    res.json({ ok: true, admin: (req as any).admin });
});