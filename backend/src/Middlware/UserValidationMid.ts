import { Request, Response, NextFunction } from "express";
import { User } from "../DB_Service/Users/UserModel";

export function validatePassword(req: Request, res: Response, next: NextFunction) {
    const password: string = req.body.password;
    if (password == null) {
        return res.status(400).json({ error: "Must enter a password" });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: "Invalid password. Must enter at least 8 keys" });
    }
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    if (!hasLetters || !hasNumbers) {
        return res.status(400).json({ error: "Invalid password. password must contain letters and digits." });
    }
    next();
}

export async function checkUser(req: Request, res: Response, next: NextFunction) {
    const id = req.body.id || req.body.userId;
    const email = req.body.email;
    if (id != undefined && id.length === 9) {

        const isUser = await User.findById(id);
        if (isUser != null)
            return res.status(400).json({ error: "The user ID already exists" });
    }
    if (email != undefined && email.includes('@')) {

        const isUser = await User.find({ email });
        if (isUser.length > 0)
            return res.status(400).json({ error: "This user email already exists" });
    }
    next();
}
