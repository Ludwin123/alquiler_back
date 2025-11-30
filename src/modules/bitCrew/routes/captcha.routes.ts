import { Router } from "express";
import { validateCaptcha } from "../controllers/captcha.controller";

const router = Router();

router.post("/validate-captcha", validateCaptcha);

export default router;
