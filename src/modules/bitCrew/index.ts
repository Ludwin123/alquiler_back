import { Router } from "express";
/*import availabilityRoutes from "./routes/availability.routes";

const router = Router();

router.use("/availability", availabilityRoutes);

export default router;
*/
import captchaRoutes from "./routes/captcha.routes";

export const bitCrewModule = (app: any) => {
  app.use("/api/bitcrew/captcha", captchaRoutes);
  // tus otras rutas ya existentes…
};
