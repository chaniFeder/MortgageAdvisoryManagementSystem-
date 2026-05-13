import { Router, Request, Response, RequestHandler } from 'express';
import { User } from '../../DB_Service/Users/UserModel'
import { validatePassword, checkUser } from '../../Middlware/UserValidationMid'
import { RequiredParametersInUser } from '../../Middlware/RequiredParametersMid';
import { userService } from '../../DB_Service/Users/UserService';
import { AuthService } from './JwtUtils';
import { logger } from "../../Utils/Logger";
import bcrypt from 'bcrypt';

export const router = Router();

router.use(validatePassword);

const authService = new AuthService();

router.post('/register', RequiredParametersInUser, checkUser, async (req: Request, res: Response) => {

    try {
        const { userId, id, name, email, password, role } = req.body;
        const resolvedId = userId || id;
        const newUser: any = { _id: resolvedId, name, email, password, role };
        // הצפנת הסיסמה
        const hashedPassword = await bcrypt.hash(newUser.password, 10);
        newUser.password = hashedPassword;
        const user = await userService.createUser(newUser);
        res.status(201).json(user);
    }
    catch (error: any) {
        logger.error(`Failed to register user: ${error.message}`);
        res.status(500).json({ error: error?.message });
    }
});

router.post("/login", async (req, res) => {
    const { userId, password } = req.body;
    if (!userId || !password) {
        return res.status(401).json({ error: "Id and password required!" });
        logger.debug("Failed login attempt");
    }
    const user = await User.findById(userId);
    if (!user) {
        logger.debug("Failed login attempt");
        return res.status(401).json({ error: "The user doesn't exist in the system." });
    }
    // בדיקת סיסמה מוצפנת
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        logger.debug("Failed login attempt");
        return res.status(401).json({ error: "You entered the wrong password" });
    }
    const token = authService.generateToken(userId, user.role);
    logger.info(`User: ${user._id} logged in -> token issued.`);
    return res.json({ token: `Bearer ${token}` });
});