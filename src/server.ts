import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import tenantRoutes from "./interfaces/routes/tenantRoutes";
const PORT: any = process.env.PORT || 3000;
const app = express();
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = ['https://nestcrm.com.au', 'https://www.nestcrm.com.au'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ➡️ ${req.method} ${req.url}`);
    next();
});


app.get('/', (_req: Request, res: Response) => {
    res.send('✅ EC2 instance is running and healthy!');
});

// ✅ Register API routes
app.use("/api/tenants", tenantRoutes);

app.post('/api/logout', (req: Request, res: Response) => {
    res.setHeader("Set-Cookie", [
        `token=; Path=/; Domain=.nestcrm.com.au; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=None`,
    ]);

    res.status(200).json({ message: "✅ Logged out successfully" });
});

app.get('/api/status', (req: Request, res: Response) => {
    res.json({
        message: '🟢 API is working fine!',
    });
});

await fetch("https://nestcrm.com.au/api/logout", {
    method: "POST",
    credentials: "include", // required to send the cookie
});

// ✅ Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ NestCRM Backend is running on http://0.0.0.0:${PORT}`);
});
