import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
if (!JWT_SECRET) {
    // Bygget skal fortsatt lykkes, men logg tydelig ved runtime hvis hemmeligheten mangler
    console.warn("[JWT] WARNING: JWT_SECRET is empty – set a proper secret in Fly secrets");
}

/** Signer et admin-token (default utløp: 12h) */
export function signAdminJwt(subject: string, options?: SignOptions): string {
    const payload = { sub: subject, role: "admin" as const };
    const opts: SignOptions = { expiresIn: "12h", ...options };
    return jwt.sign(payload, JWT_SECRET, opts);
}

/** Krev gyldig admin-JWT i Authorization: Bearer <token> */
export function requireAdminJwt(req: Request, res: Response, next: NextFunction) {
    const auth = req.header("Authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
        return res.status(401).json({ ok: false, error: "Missing token" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;
        const claims = typeof decoded === "string" ? {} : decoded;
        if ((claims as any)?.role !== "admin") {
            return res.status(403).json({ ok: false, error: "Forbidden" });
        }
        (req as any).admin = claims.sub ?? true;
        return next();
    } catch {
        return res.status(401).json({ ok: false, error: "Invalid token" });
    }
}