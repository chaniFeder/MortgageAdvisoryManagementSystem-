import { Request, Response, NextFunction } from "express";
import { logger } from "../Utils/Logger";

//בגלל שטיפלנו ברוב מקרי הקצה, זה לא יגיע לפה אלא אם כן משהו ממש קיצוני שלא אמור לקרות
export function errorHandler(err: any, req: Request, res: Response) {
  logger.error(`Error: ${err.message || err}`)
  res.status(500).json({ error: err.message });
}
