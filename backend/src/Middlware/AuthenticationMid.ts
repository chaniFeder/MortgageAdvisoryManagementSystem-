import { Request, Response, NextFunction } from "express";
import { AuthService } from "../Routers/Authentication/JwtUtils";
import { logger } from "../Utils/Logger";

const authService = new AuthService();

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader) {
        logger.debug("Missing Authorization header!");
        return res.status(401).json({ error: "Missing Authorization header!" });
    }
    const partsToken = authHeader.split(" ");
    if (partsToken.length !== 2 || partsToken[0] !== "Bearer") {
        logger.debug("Invalid Authorization header format!");
        return res.status(401).json({ error: "Invalid Authorization header format!" });
    }
    const token = partsToken[1];
    try {
        const decoded = authService.verifyToken(token);
        if (typeof decoded === 'object' && decoded !== null) {
            (req as any).user = {
                id: decoded.id,
                role: decoded.role
            };
        }
        next();
    } catch (err: any) {
        logger.debug("Token verification failed: " + (err?.message || err));
        return res.status(401).json({ error: "Unauthorized" });
    }
}