import { Request, Response } from "express";
import { CaptchaService } from "../services/captcha.service";

export const validateCaptcha = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token de captcha no enviado",
      });
    }

    const googleResponse = await CaptchaService.validateCaptcha(token);

    return res.json({
      success: googleResponse.success,
      score: googleResponse.score,
      action: googleResponse.action,
    });

  } catch (error) {
    console.error("Error validando captcha:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno validando captcha",
    });
  }
};
