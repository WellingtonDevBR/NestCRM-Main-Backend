import { Request, Response } from "express";
import { TenantUseCase } from "../../application/usecases/TenantUseCase";

export class TenantController {
    static async signUp(req: Request, res: Response) {
        try {
            const tenant = await TenantUseCase.signUp(req.body);
            res.status(201).json(tenant);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const result = await TenantUseCase.login(req.body);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    }
}
