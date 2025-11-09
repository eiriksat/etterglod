import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = (process.env.JWT_SECRET || "").trim();

if (!JWT_SECRET) {
    // Ikke crash ved build, men logg tydelig
    // (i prod MÅ dette være satt via flyctl secrets)
    console.warn("[jwt] JWT_SECRET is not set. JWT auth will fail at runtime.");
}

export function signToken(
    payload: object,
    expiresIn: string | number = "7d",
): string {
    if (!JWT_SECRET) throw new Error("JWT secret missing");
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function requireJWT(req: Request, res: Response, next: NextFunction) {
    try {
        const auth = String(req.headers.authorization || "");
        const m = auth.match(/^Bearer\s+(.+)$/i);
        if (!m) return res.status(401).json({ ok: false, error: "Unauthorized" });

        if (!JWT_SECRET) return res.status(500).json({ ok: false, error: "Server misconfig" });

        const decoded = jwt.verify(m[1], JWT_SECRET);
        // Heng på req for videre bruk
        (req as any).user = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ ok: false, error: "Invalid token" });
    }
}