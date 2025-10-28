import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import api from "./routes/index.js";

const app = express();

// Sørg for at uploads-mappen finnes FØR vi registrerer static
fs.mkdirSync(path.resolve("uploads"), { recursive: true });

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

// Statisk serving av opplastede bilder
app.use("/uploads", express.static(path.resolve("uploads")));

// API-røtter
app.use("/api", api);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () =>
    console.log(`API listening on http://localhost:${PORT}`)
);