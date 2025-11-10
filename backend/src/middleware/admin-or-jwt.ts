import type { Request, Response, NextFunction } from "express";
import { requireAdmin } from "./admin.js";       // legacy bearer token (backend/token.txt)
import { requireAdminJwt } from "./jwt.js";      // new JWT-based admin auth

/** Accept either a valid Admin JWT or the legacy admin token. */
export function requireAdminOrJwt(req: Request, res: Response, next: NextFunction) {
    const h = String(req.headers.authorization || "");
    // If a Bearer token is present, try JWT first:
    if (h.toLowerCase().startsWith("bearer ")) {
        return requireAdminJwt(req, res, (err?: any) => {
            if (!err) return next();
            // Fall back to legacy admin token if JWT fails
            return requireAdmin(req, res, next);
        });
    }
    // No Bearer header → try legacy admin token
    return requireAdmin(req, res, next);
}