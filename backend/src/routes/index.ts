import { Router } from "express";
import { health } from "./health.js";
import { contact } from "./contact.js";
import { memorials } from "./memorials.js";
import { attendance } from "./attendance.js";
import { memory } from "./memory.js";

const router = Router();

router.use(health);
router.use(contact);
router.use(memorials);
router.use(attendance);
router.use(memory);

export default router; // 👈 eneste export