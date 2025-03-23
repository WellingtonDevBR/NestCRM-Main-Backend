import dotenv from "dotenv";
dotenv.config();

export const ENV = {
    PORT: process.env.PORT || "3000",
    AWS_REGION: process.env.AWS_REGION || "us-east-2",
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "",
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
    JWT_SECRET: process.env.JWT_SECRET || "supersecretkey",
};
