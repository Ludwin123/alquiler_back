import { JWTPayload } from '../types/auth.types';
import { Request, Response } from 'express';
import teamsysService from '../services/teamsys.service';
import { ApiResponse} from '../types/index';
import Usuario, { UserDocument } from '@/models/user.model';
import { UserAuthDocument } from '@/models/userAuth.model';
import { SessionService, getActiveSession ,createSession} from '../services/session.service';
import { handleError } from '../errors/errorHandler';
import { validarPassword } from '../utils/validaciones';
import { AuthService } from '../services/auth.service';
//import { JWTPayload } from '../types/auth.types';
import mongoose from 'mongoose';
import { forceLogoutUser } from "../utils/socket";
const UAParserLib = require("ua-parser-js") as unknown as {
  new (ua?: string): {
    getBrowser(): { name?: string; version?: string; major?: string };
    getOS(): { name?: string; version?: string };
    getDevice(): { vendor?: string; model?: string; type?: string };
    getEngine(): { name?: string; version?: string };
    getCPU(): { architecture?: string };
  };
};
// Extender el tipo Request para este archivo
declare module 'express' {
  interface Request {
    user?: JWTPayload;
  }
}

const sessionService = new SessionService();
const authService = new AuthService();

/*obtener todos los registros de usuario */
export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await teamsysService.getAll();
    const response: ApiResponse<UserDocument[]> = {
      success: true,
      count: data.length,
      data,
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};

export const existsByEmail = async (req: Request, res: Response) => {
  try {
    const email = (req.query.email ?? '').toString().trim();

    if (!email) {
      return res.status(400).json({ error: 'El parámetro "email" es requerido' });
    }

    const exists = await teamsysService.verificarCorreo(email);

    return res.json({ exists });
  } catch (err) {
    console.error('Error en existsByEmail:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/*obtener usr por id */
export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await teamsysService.getById(req.params.id);
    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
      return;
    }
    const response: ApiResponse<UserDocument> = {
      success: true,
      data,
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};

/*crear nuevo usr 
  que verifique si un usr con el mismo 
*/
export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await teamsysService.create(req.body);

    if (!user) {
      throw new Error("Usuario no encontrado");
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

    const { accessToken, refreshToken } = authService.generateTokens(user);

      await createSession({
        userId: user._id.toString(),
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
    const response: ApiResponse<{accessToken: string, refreshToken: string, user: UserDocument}> = {
      success: true,
      message: 'Registro creado exitosamente',
      data: {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: user,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    handleError(error, res);
  }
};

/*actualizar un usr existente */
export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await teamsysService.update(req.params.id, req.body);
    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
      return;
    }
    const response: ApiResponse<UserDocument> = {
      success: true,
      data,
      message: 'Registro actualizado exitosamente'
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};

/*eliminaar un usr por id */
export const remove = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await teamsysService.delete(req.params.id);
    if (!data) {
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
      return;
    }
    res.json({
      success: true,
      message: 'Registro eliminado correctamente',
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * tarea: endpoint de autenticacion
 * Registrar un nuevo usuario (versión autenticación)
 * Este endpoint se usa para crear usuarios con validación previa
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;

    const nuevoUsuario = await teamsysService.create(data);
    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      data: nuevoUsuario,
    });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Iniciar sesión de un usuario existente
 * Verifica correo y contraseña
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { correoElectronico, password } = req.body;

    if (!correoElectronico || !password) {
      res.status(400).json({
        success: false,
        message: 'El correo electrónico y la contraseña son requeridos',
      });
      return;
    }

    const usuario = await teamsysService.autenticarUsuario(correoElectronico, password);

    if (!usuario) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
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

    if (! session) {
      const { accessToken, refreshToken } = authService.generateTokens(usuario);

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

      res.json({
        success: true,
        message: "Inicio de sesión exitoso",
        data: {
          accessToken,
          refreshToken,
          user: usuario,
          deviceInfo,
        },
      });
      return;
    }
    if (!session.isActive) {
      if (session.refreshToken) {
        try {
          const payload = authService.verifyRefreshToken(session.refreshToken);

          if (payload.userId !== usuario._id.toString()) {
            throw new Error("Refresh token does not belong to this user");
          }

          const newAccessToken = authService.generateAccessToken({
            userId: usuario._id.toString(),
            email: usuario.correo,
          });

          session.token = newAccessToken;
          session.isActive = true;
          session.lastActivity = new Date();
          await session.save();

          res.json({
            success: true,
            message: "Inicio de sesión exitoso",
            data: {
              accessToken: newAccessToken,
              refreshToken: session.refreshToken,
              user: usuario,
            },
          });
          return;
        } catch {
          // refresh token inválido o expirado → borrar sesión y crear nueva
          await session.deleteOne();

          const { accessToken, refreshToken } =
            authService.generateTokens(usuario);

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

          res.json({
            success: true,
            message: "Inicio de sesión exitoso",
            data: {
              accessToken,
              refreshToken,
              user: usuario,
            },
          });
          return;
        }
      } else {
        // Sesión inactiva sin refreshToken → la descartamos y creamos nueva
        await session.deleteOne();

        const { accessToken, refreshToken } =
          authService.generateTokens(usuario);

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

        res.json({
          success: true,
          message: "Inicio de sesión exitoso",
          data: {
            accessToken,
            refreshToken,
            user: usuario,
          },
        });
        return;
      }
    }

    // 3) Sesión activa: reutilizar tokens, actualizar lastActivity
    session.lastActivity = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        accessToken: session.token,
        refreshToken: session.refreshToken,
        user: usuario,
      }
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const actualizarAutentificacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user=await teamsysService.getById(req.params.id);
    const auth=await teamsysService.getUserAuthByUserId(req.params.id);
    if(user==null || auth ==null)throw new Error("Usuario no existente");
    const providers :string[]=auth.authProvider as string[];
    const accion = String(req.body.accion ?? '').toLowerCase();
    const provider = String(req.body.provider ?? '').toLowerCase();
    const password: string | undefined = req.body.password;
    const email:string | undefined=req.body.email;
    
    if (!['agregar', 'eliminar'].includes(accion)) {
      res.status(400).json({ success: false, message: 'Acción inválida. Usa "agregar" o "eliminar".' });
      return;
    }

    if(accion==='agregar'){
      if(providers.includes(provider)){
        res.status(409).json({ success: false, message: `Este método ya está habilitado: ${provider}` });
        return;
        
      }
        if (provider === 'local') {
        if (!password) {
          res.status(400).json({ success: false, message: 'Debe proporcionar una contraseña para habilitar "local".' });
          return;
        }
        if (!validarPassword(password)) {
          res.status(400).json({ success: false, message: 'La contraseña no cumple con los requisitos mínimos.' });
          return;
        }
      }
      if(provider=='google'){
        if(!(user.correo===email)){
            res.status(404).json({ success: false, message: `el correo : ${email} no coincide` });
            return;
        }
        user.authProvider=provider;}
      providers.push(provider);
      if(provider=='google')user.authProvider=provider;
      auth.authProvider=providers;
      
    }
    if(accion==='eliminar'){
      if (!providers.includes(provider)) {
        res.status(404).json({ success: false, message: `Este método no está habilitado: ${provider}` });
        return;
      }
      if (providers.length <= 1) {
        res.status(409).json({ success: false, message: 'No puedes eliminar tu único método de autenticación.' });
        return;
      }

      // Si eliminamos LOCAL, removemos password
      if (provider === 'local') {
        user.password = undefined;
      }
      if(provider=='google')user.authProvider='local';
      // Eliminar provider
      auth.authProvider = providers.filter(p => p !== provider);
    }

    const data = await teamsysService.update(req.params.id, user);
    const authData=await teamsysService.updateUserAuthProviders(req.params.id,auth.authProvider)
    if (!data || !authData) {
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
      return;
    }
    const response: ApiResponse<UserDocument> = {
      success: true,
      data,
      message: 'Registro actualizado exitosamente'
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};
type GeoPoint = { type: 'Point'; coordinates: [number, number] };

function isGeoPoint(value: unknown): value is GeoPoint {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    obj.type === 'Point' &&
    Array.isArray(obj.coordinates) &&
    obj.coordinates.length === 2 &&
    typeof obj.coordinates[0] === 'number' &&
    typeof obj.coordinates[1] === 'number'
  );
}
export const updateMapa = async (req: Request, res: Response): Promise<void> => {
  try {
    const auth = await teamsysService.getUserAuthByUserId(req.params.id);
    const ubicacion = req.body.ubicacion as unknown;

    if (!auth) {
      res.status(404).json({ success: false, message: 'Registro no encontrado' });
      return;
    }

    if (!isGeoPoint(ubicacion)) {
      res.status(400).json({
        success: false,
        message: 'La ubicación debe tener el formato { type: "Point", coordinates: [longitud, latitud] }',
      });
      return;
    }


    if (auth.mapaModificacion > 0) {
      const authActualizado = await teamsysService.decrementMapaModificacion(req.params.id);
      // Si por alguna razón no encontró el doc al decrementar:
      const data=await teamsysService.updateUbicacionUser(req.params.id,ubicacion);
      if (!authActualizado || !data) {
        res.status(404).json({ success: false, message: 'Registro de autenticación no encontrado para actualizar' });
        return;
      }

      const response: ApiResponse<UserDocument> = {
        success: true,
        data: data,
        message: 'Registro actualizado exitosamente',
      };
      res.json(response);
      return;
    }

    // Límite alcanzado: no se decremente
    const response: ApiResponse<UserAuthDocument | null> = {
      success: false,
      data: null,
      message: 'Alcanzó el límite de actualizaciones',
    };
    res.status(400).json(response);
  } catch (error) {
    handleError(error, res);
  }
};
export const updateTelefono=async (req: Request, res: Response): Promise<void> => {
  try {
    const telefono:string=req.body.telefono;
    const telefonoValido = /^[1-9][0-9]{7}$/;

    if (!telefono || typeof telefono !== 'string'||!telefonoValido.test(telefono)) {
      res.status(404).json({
        success: false,
        message: 'Numero de telefono no valido',
      });
      return;
    }
    const data =await teamsysService.updateTelefonoUser(req.params.id,telefono);
    if(!data){
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }
    const response: ApiResponse<UserDocument> = {
      success: true,
      data,
      message: 'Registro actualizado exitosamente'
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};

export const getAuthById= async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await teamsysService.getUserAuthByUserId(req.params.id);
    if (data==null) {
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
      return;
    }
    const response: ApiResponse<UserAuthDocument | null> = {
      success: true,
      data,
      message: 'Proveedores de auntenticacion'
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};

export const agregarAutentificacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user=await teamsysService.getById(req.params.id);
    const auth=await teamsysService.getUserAuthByUserId(req.params.id);
    if(user==null || auth ==null)throw new Error("Usuario no existente");
    const providers :string[]=auth.authProvider as string[];
    const provider = String(req.body.provider ?? '').toLowerCase();
    const password: string | undefined = req.body.password;
    const email:string | undefined=req.body.email;
    
      if(providers.includes(provider)){
        res.status(409).json({ success: false, message: `Este método ya está habilitado: ${provider}` });
        return;
        
      }
      let data;
        if (provider === 'local') {
        if (!password) {
          res.status(400).json({ success: false, message: 'Debe proporcionar una contraseña para habilitar "local".' });
          return;
        }
        if (!validarPassword(password)) {
          res.status(400).json({ success: false, message: 'La contraseña no cumple con los requisitos mínimos.' });
          return;
        }
        data=await teamsysService.setPasswordUnderCorreo(req.params.id, password);
      }
      if(provider=='google'){
        if(!(user.correo===email)){
            res.status(404).json({ success: false, message: `el correo : ${email} no coincide` });
            return;
        }
        user.authProvider=provider;
        data=await teamsysService.update(req.params.id, user);
      }
      providers.push(provider);
      
    
      console.log(user)
    
    console.log(data)
    const authData=await teamsysService.updateUserAuthProviders(req.params.id,auth.authProvider)
    if (!data || !authData) {
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
      return;
    }
    const response: ApiResponse<UserDocument> = {
      success: true,
      data,
      message: 'Registro actualizado exitosamente'
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};

export const eliminarAutentificacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const user=await teamsysService.getById(req.params.id);
    const auth=await teamsysService.getUserAuthByUserId(req.params.id);
    if(user==null || auth ==null)throw new Error("Usuario no existente");
    const providers :string[]=auth.authProvider as string[];
    const provider = String(req.body.provider ?? '').toLowerCase();

      if (!providers.includes(provider)) {
        res.status(404).json({ success: false, message: `Este método no está habilitado: ${provider}` });
        return;
      }
      if (providers.length <= 1) {
        res.status(409).json({ success: false, message: 'No puedes eliminar tu único método de autenticación.' });
        return;
      }
      console.log(provider)
      // Si eliminamos LOCAL, removemos password
      let data;
      if (provider == 'local') {
        user.password = undefined;
        data = await teamsysService.eliminarPasswordUser(req.params.id);
      }
      if(provider=='google'){user.authProvider='local';
      // Eliminar provider
      console.log(user)
    data=await teamsysService.update(req.params.id,user);}
    auth.authProvider = providers.filter(p => p !== provider);
    const authData=await teamsysService.updateUserAuthProviders(req.params.id,auth.authProvider)
    if (!data || !authData) {
      res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
      return;
    }
    const response: ApiResponse<UserDocument> = {
      success: true,
      data,
      message: 'Registro actualizado exitosamente'
    };
    res.json(response);
  } catch (error) {
    handleError(error, res);
  }
};

// En controllers/teamsys.controller.ts - Agregar este export
export const cambiarContraseña = async (req: Request, res: Response): Promise<void> => {
  try {
    //const { userId} = req.user as JWTPayload;
    //2daModif          const user = req.user as JWTPayload | undefined;
    //const user = (req as any).user as JWTPayload; 12/11/25
    const user = (req as any).authuser as JWTPayload;
    console.log('🔍 user en controlador:', user);
    //if(!userId){
    if (!user || !user.userId) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });    
      return;
    }
    const { userId } = user;
    console.log('✅ userId en controlador:', userId);
    //console.log('🔍 UserId correcto:', userId);
   // console.log('🔍 Es ObjectId válido?:', mongoose.Types.ObjectId.isValid(userId));
    const { contraseñaActual, nuevaContraseña, confirmacionContraseña } = req.body;


    // Validaciones básicas
    if (!contraseñaActual || !nuevaContraseña || !confirmacionContraseña) {
      res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
      });
      return;
    }

    // Verificar coincidencia de contraseñas
    if (nuevaContraseña !== confirmacionContraseña) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña y la confirmación no coinciden',
      });
      return;
    }

    // Validar requisitos de nueva contraseña (usando la función existente)
    if (!validarPassword(nuevaContraseña)) {
      res.status(400).json({
        success: false,
        message: 'La nueva contraseña no cumple con los requisitos mínimos: mínimo 8 caracteres, máximo 16, al menos una mayúscula, una minúscula y un número',
      });
      return;
    }

    // Cambiar contraseña
    const usuarioActualizado = await teamsysService.cambiarContraseña(
      userId, 
      contraseñaActual, 
      nuevaContraseña
    );

    // Cerrar todas las sesiones del usuario (usando el servicio existente)
    const sessionService = new SessionService();

// El token actual ya lo puso el authMiddleware
const token = req.token;
if (!token) {
  res.status(401).json({
    success: false,
    message: 'Token no encontrado en la petición',
  });
  return;
}

// Buscar la sesión actual a partir del token
const session = await sessionService.getSessionByToken(token);

if (!session) {
  throw new Error('Session no encontrada');
}
const closedCount = await sessionService.deleteAllSessionsExceptCurrentM(
  userId,
  session._id.toString()
);
console.log("🔐 Sesiones cerradas (BD) al cambiar contraseña:", closedCount);

// 2️⃣ Leer el socketId que mandó el front
const currentSocketId =
  (req.headers["x-socket-id"] as string | undefined) || undefined;
console.log("🛰️ x-socket-id en cambiarContraseña:", currentSocketId);

// 3️⃣ Mandar evento por socket a los otros dispositivos
forceLogoutUser(userId, currentSocketId);

res.json({
  success: true,
  message: 'Contraseña cambiada exitosamente. Todas las sesiones han sido cerradas por seguridad.',
  data: {
    usuario: {
      id: usuarioActualizado._id,
      correo: usuarioActualizado.correo,
      nombre: usuarioActualizado.nombre
    }
  }
});

  } catch (error) {
    handleError(error, res);
  }
};