import jwt from "jsonwebtoken";

const SECRET_KEY = "C&EProject";

export class AuthService {

    generateToken(id: string, role: string): string {
        const payload = { id, role };
        return jwt.sign(payload, SECRET_KEY, { expiresIn: "365d" });
    }

    verifyToken(token: string): any {
        return jwt.verify(token, SECRET_KEY);
    }
}