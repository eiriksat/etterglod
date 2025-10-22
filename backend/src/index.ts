import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes";

const app = express();

import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 60_000, // 1 min
    max: 20,          // 20 requests/minutt/IP
});
app.use(limiter);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());
app.use("/api", router);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
