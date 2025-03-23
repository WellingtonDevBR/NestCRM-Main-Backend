import { AuthService } from "../../application/services/AuthService";
import { UserRepositoryImpl } from "../../infrastructure/database/UserRepositoryImpl";

const authService = new AuthService(new UserRepositoryImpl());

export const AuthController = {
    signIn: async (req: any, res: any) => {
        try {
            const { email, password } = req.body;
            const response = await authService.signIn(email, password);
            res.json(response);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
};
