import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import tenantRoutes from "./interfaces/routes/tenantRoutes";
const PORT: any = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(cookieParser());

// ✅ CORS for all nestcrm subdomains
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [/\.nestcrm\.com\.au$/, 'https://nestcrm.com.au', 'https://www.nestcrm.com.au'];
        if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ✅ Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ➡️ ${req.method} ${req.url}`);
    next();
});

// ✅ Root
app.get('/', (_req: Request, res: Response) => {
    res.send('✅ EC2 instance is running and healthy!');
});

// ✅ Logout
app.post('/api/logout', (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "https://nestcrm.com.au");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    res.cookie("token", "", {
        domain: ".nestcrm.com.au",
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
        expires: new Date(0),
    });

    res.status(200).json({ message: "✅ Logged out successfully" });
});

// ✅ Register routes
app.use("/api/tenants", tenantRoutes);

// ✅ Status
app.get('/api/status', (_req: Request, res: Response) => {
    res.json({ message: '🟢 API is working fine!' });
});

// ✅ Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ NestCRM Backend is running on http://0.0.0.0:${PORT}`);
});
