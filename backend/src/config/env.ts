import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 3000,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || "nexus",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD ?? "",
    ssl: process.env.DB_SSL === "true",
  },
};
