import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import api from "./routes/index.js";

const app = express();

// Sørg for at uploads-mappen finnes FØR static
fs.mkdirSync(path.resolve("uploads"), { recursive: true });

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "https://etterglod.no" }));
app.use(express.json());

// Statisk serving av opplastede bilder
app.use("/uploads", express.static(path.resolve("uploads")));

// API-røtter
app.use("/api", api);

// Fly.io setter PORT i env. Default til 8080 i prod.
const PORT = Number(process.env.PORT ?? 8080);

// **VIKTIG**: bind til 0.0.0.0 i containeren
app.listen(PORT, "0.0.0.0", () => {
    console.log(`API listening on http://0.0.0.0:${PORT}`);
});