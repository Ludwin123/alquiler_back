import { Router, Request, Response } from "express";
import {
  createFixer,
  getFixer,
  updateIdentity,
  checkCI,
  updateLocation,
  updatePayments,
  acceptTerms,
  updateCategories,
  listByCategory,
  getFixerByUser,
  getWorkExperience,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition,
  createCertification,
  updateCertification,
  deleteCertification,
} from "../controllers/fixers.controller";
import { certificationUploadMiddleware } from "../middlewares/certificationUpload";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    module: "fixer",
    endpoints: [
      "GET /check-ci?ci=123456",
      "POST /",
      "GET /by-category",
      "PUT /:id/identity",
      "PUT /:id/location",
      "PUT /:id/categories",
      "PUT /:id/payments",
      "PUT /:id/terms",
      "GET /:id/work-experience",
      "POST /:id/work-experience/jobs",
      "PUT /:id/work-experience/jobs/:jobId",
      "DELETE /:id/work-experience/jobs/:jobId",
      "POST /:id/work-experience/certifications",
      "PUT /:id/work-experience/certifications/:certificationId",
      "DELETE /:id/work-experience/certifications/:certificationId",
      "GET /:id",
    ],
  });
});

// Handlers (ya asegurados como funciones)
router.get("/check-ci", checkCI);
router.post("/", createFixer);
router.get("/by-category", listByCategory);
router.get("/user/:userId", getFixerByUser);
router.put("/:id/identity", updateIdentity);
router.put("/:id/location", updateLocation);
router.put("/:id/categories", updateCategories);
router.put("/:id/payments", updatePayments);
router.put("/:id/terms", acceptTerms);
router.get("/:id/work-experience", getWorkExperience);
router.post("/:id/work-experience/jobs", createJobPosition);
router.put("/:id/work-experience/jobs/:jobId", updateJobPosition);
router.delete("/:id/work-experience/jobs/:jobId", deleteJobPosition);
router.post(
  "/:id/work-experience/certifications",
  certificationUploadMiddleware,
  createCertification
);
router.put(
  "/:id/work-experience/certifications/:certificationId",
  certificationUploadMiddleware,
  updateCertification
);
router.delete("/:id/work-experience/certifications/:certificationId", deleteCertification);
router.get("/:id", getFixer);

export default router;
