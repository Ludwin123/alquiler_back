import { Request, Response } from "express";
import { ApiResponse } from "@/types";
import { TokenResponse } from "../types/token.types";
import { AuthService} from "../services/auth.service";
import { handleError } from "../errors/errorHandler";
import { JWTPayload } from "../types/auth.types";
import teamsysService from "../services/teamsys.service";
import { SessionService,createSession,getActiveSession } from '../services/session.service';
const UAParserLib = require("ua-parser-js") as unknown as {
  new (ua?: string): {
    getBrowser(): { name?: string; version?: string; major?: string };
    getOS(): { name?: string; version?: string };
    getDevice(): { vendor?: string; model?: string; type?: string };
    getEngine(): { name?: string; version?: string };
    getCPU(): { architecture?: string };
  };
};

export class AuthController {
  private authService: AuthService;
  private sessionService: SessionService;

  constructor() {
    this.authService = new AuthService();
    this.sessionService = new SessionService();
  }

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.body;

      if (! code || typeof code !== 'string') {
        res.status(400).json({
          message: 'Authorizaction code is required'
        })
          throw new Error('Authorizaction code is required');
      }

      const result  = await this.authService.loginWithGoogle(code as string)
      console.log(result)
      if (result.user.correo!=null){

        const usuario=await teamsysService.verificarCorreo(result.user.correo)
        console.log(usuario)
        if(usuario==null){
          res.status(500).json({
          success: false,
          data: result,
          message: 'error en la back',
      });
      return;
        }
        
        const rawUserAgent = req.headers["user-agent"] || "Unknown";
        
            const rawIp =
              (req.headers["x-forwarded-for"] as string) || // por si hay proxy
              req.ip ||
              req.socket.remoteAddress ||
              "Unknown";
        
            const ip = rawIp.replace("::ffff:", "");
        
            const acceptLanguage =
              (req.headers["accept-language"] as string) || "Unknown";
            const origin = (req.headers["origin"] as string) || "Unknown";
            const referer = (req.headers["referer"] as string) || "Unknown";
        
            const parser = new UAParserLib(rawUserAgent);
        
            const browser = parser.getBrowser(); // { name, version, major }
            const os = parser.getOS(); // { name, version }
            const device = parser.getDevice(); // { vendor, model, type }
            const engine = parser.getEngine(); // { name, version }
            const cpu = parser.getCPU(); // { architecture }
        
            const deviceInfo = {
              userAgent: rawUserAgent,
              ip: ip,
              browser: browser.name
                ? `${browser.name} ${browser.version || ""}`.trim()
                : undefined,
              os: os.name ? `${os.name} ${os.version || ""}`.trim() : undefined,
              device:
                device.model || device.vendor
                  ? `${device.vendor || ""} ${device.model || ""}`.trim()
                  : undefined,
        
              deviceType: device.type || undefined, // mobile / tablet / desktop
              deviceVendor: device.vendor || undefined,
              deviceModel: device.model || undefined,
              cpuArch: cpu.architecture || undefined,
              engine: engine.name
                ? `${engine.name} ${engine.version || ""}`.trim()
                : undefined,
              raw: {
                type: device.type || undefined,
                vendor: device.vendor || undefined,
              },
            };
        
            const locationInfo = {
              country: undefined,
              city: undefined,
              lat: undefined,
              lng: undefined,
            };
            
            const session = await getActiveSession({
          userId: usuario._id.toString(),
          ip,
          userAgent: rawUserAgent,
          });
        
            if (!session) {
              const { accessToken, refreshToken } = this.authService.generateTokens(usuario);
        
              await createSession({
                userId: usuario._id.toString(),
                token: accessToken,
                refreshToken,
                deviceInfo,
                location: locationInfo,
                extraHeaders: {
                  acceptLanguage,
                  origin,
                  referer,
                },
              });
              res.status(200).json({
          success: false,
          data: {accessToken: accessToken,
                refreshToken: refreshToken,
                user:usuario},
          message: 'usuario ya registrado',
      });
      return;
            }
            if (!session.isActive) {
                  if (session.refreshToken) {
                    try {
                      const payload = this.authService.verifyRefreshToken(session.refreshToken);
            
                      if (payload.userId !== usuario._id.toString()) {
                        throw new Error("Refresh token does not belong to this user");
                      }
            
                      const newAccessToken = this.authService.generateAccessToken({
                        userId: usuario._id.toString(),
                        email: usuario.correo,
                      });
            
                      session.token = newAccessToken;
                      
                      session.isActive = true;
                      session.lastActivity = new Date();
                      await session.save();
            
                      res.status(200).json({
          success: false,
          data: {accessToken: newAccessToken,
                refreshToken: session.refreshToken,
                user:usuario},
          message: 'usuario ya registrado',
      });
      return;
                    } catch {
                      // refresh token inválido o expirado → borrar sesión y crear nueva
                      await session.deleteOne();
            
                      const { accessToken, refreshToken } =
                        this.authService.generateTokens(usuario);
            
                      await createSession({
                    userId: usuario._id.toString(),
                    token: accessToken,
                    refreshToken,
                    deviceInfo,
                    location: locationInfo,
                    extraHeaders: {
                      acceptLanguage,
                      origin,
                      referer,
                    },
                  });
                  res.status(200).json({
          success: false,
          data: {accessToken: accessToken,
                refreshToken: refreshToken,
                user:usuario},
          message: 'usuario ya registrado',
      });
      return;
                    }
                  } else {
                    // Sesión inactiva sin refreshToken → la descartamos y creamos nueva
                    await session.deleteOne();
            
                    const { accessToken, refreshToken } =
                      this.authService.generateTokens(usuario);
            
                    await createSession({
                    userId: usuario._id.toString(),
                    token: accessToken,
                    refreshToken,
                    deviceInfo,
                    location: locationInfo,
                    extraHeaders: {
                      acceptLanguage,
                      origin,
                      referer,
                    },
                  });
                  res.status(200).json({
          success: false,
          data: {accessToken: accessToken,
                refreshToken: refreshToken,
                user:usuario},
          message: 'usuario ya registrado',
      });
      return;
                  }
    }

    res.status(200).json({
          success: false,
          data: {accessToken: session.token,
                refreshToken: session.refreshToken,
                user:usuario},
          message: 'usuario ya registrado',
      });
      return
      }
       
      res.status(500).json({
          success: false,
          data: result,
          message: 'error back',
      });
      return;
    } catch (error) {
      handleError(error, res);
    }
  }

  getCurrentUser = async (req: Request, res: Response): Promise<void> => {
    const { email, userId } = req.authuser as JWTPayload;

    const user = await teamsysService.getById(userId);

    res.status(200).json({
        success: true,
        data: user,
        message: 'Usuario recuperado correctamente!',
    });
  }
}

export const authController = new AuthController();
