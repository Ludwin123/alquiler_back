import axios from "axios";

export class CaptchaService {
  static async validateCaptcha(token: string) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      throw new Error("RECAPTCHA_SECRET_KEY no configurado");
    }

    const url = `https://www.google.com/recaptcha/api/siteverify`;

    const response = await axios.post(
      url,
      {},
      {
        params: {
          secret: secretKey,
          response: token,
        },
      }
    );

    return response.data;
  }
}
