import { User, IUser } from './UserModel';

export class UserService {

    async createUser(newUser: { userId: string, name: string, email: string, password: string, role: string }): Promise<IUser> {
        const user = await User.create(newUser);
        return await user.save();
    }

}

export const userService = new UserService();