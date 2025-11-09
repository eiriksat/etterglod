import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export function signAdminJwt(payload: object, expiresIn = "12h") {
    const secret = process.env.JWT_SECRET!;
    return jwt.sign(payload, secret, { expiresIn });
}

export function requireAdminJwt(req: Request, res: Response, next: NextFunction) {
    try {
        const auth = req.header("Authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) return res.status(401).json({ ok: false, error: "Missing token" });

        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as any;
        (req as any).admin = decoded;
        next();
    } catch (e: any) {
        return res.status(401).json({ ok: false, error: "Invalid token" });
    }
}