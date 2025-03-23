import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { ENV } from "./env";
import tenantRoutes from "./interfaces/routes/tenantRoutes";
const app = express();
app.use(express.json());
app.use(cors({
    origin: ENV.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));


app.get('/', (_req: Request, res: Response) => {
    res.send('✅ EC2 instance is running and healthy!');
});

// ✅ Register API routes
app.use("/api/tenants", tenantRoutes);

app.get('/api/status', (req: Request, res: Response) => {
    res.json({
        message: '🟢 API is working fine!',
    });
});

// ✅ Start the server
const PORT = ENV.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ NestCRM Backend is running on http://localhost:${PORT}`);
});
