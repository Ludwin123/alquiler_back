import multer, { MulterError } from "multer";
import { Request, Response, NextFunction } from "express";

export const ALLOWED_CERTIFICATION_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_CERTIFICATION_IMAGE_SIZE =
  Number(process.env.FIXER_CERTIFICATION_MAX_SIZE ?? 5 * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_CERTIFICATION_IMAGE_SIZE,
  },
});

export const certificationUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err: any) => {
    if (!err) return next();

    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ success: false, message: "La imagen supera el tamaño máximo permitido (5 MB)." });
    }

    return res
      .status(400)
      .json({ success: false, message: err?.message || "No se pudo procesar la imagen" });
  });
};
