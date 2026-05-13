import { Request, Response, NextFunction } from "express";

export function AuthorizedTeacher(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || !user.role) {
    return res.status(401).json({ error: "Not authorized!" });
  }
  if (user.role !== 'Teacher' && user.role !== 'teacher') {
    return res.status(403).json({ error: "Forbbiden" });
  }
  next();
}
