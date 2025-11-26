import { Request, Response } from "express";
import { SessionService } from "../services/session.service";
import { JWTPayload } from "../types/auth.types";
import { forceLogoutUser,disconnectUserSessionsByTokens } from "../utils/socket";

export class SessionController {
	private sessionService: SessionService;

	constructor() {
		this.sessionService = new SessionService();
	}

	/**
	 * Obtener todas las sesiones de un usuario
	 * GET /api/sessions/user/:userId
	 * @param req 
	 * @param res 
	 */
	getSessionsByUserId = async (req: Request, res: Response): Promise<void> => {
		try {
			const { userId } = req.params;

			const sessions = await this.sessionService.getSessionsByUserId(userId);

			res.status(200).json({
				success: true,
				message: 'Sessiones obtenidas exitosamente',
				data: {
					count: sessions.length,
					sessions: sessions,
				}
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

			res.status(400).json({
				success: false,
				message: 'Error al obtener sessiones',
				error: errorMessage
			});
		}
	};

	
	deleteSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { tokens } = req.body as { tokens?: string[] };
    const authUser = req.authuser as JWTPayload | undefined;

    // Validar body
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      res.status(400).json({
        success: false,
        message: "Debe enviar un arreglo 'tokens' con al menos un accessToken",
      });
      return;
    }

    if (!authUser || authUser.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "No tienes permisos para modificar estas sesiones",
      });
      return;
    }

    // Lógica en el service: marcar esas sesiones como inactivas
    const result = await this.sessionService.deactivateSessionsByTokens(
      userId,
      tokens
    );

disconnectUserSessionsByTokens(userId, tokens);

    res.status(200).json({
      success: true,
      message: "Sesiones actualizadas exitosamente",
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";

    res.status(400).json({
      success: false,
      message: "Error al actualizar sesiones",
      error: errorMessage,
    });
  }
};
	/**
	  * Eliminar todas las sesiones excepto la actual
	* DELETE /api/sessions/user/all-except-current
	*/
	deleteAllSessionsExceptCurrent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, userId } = req.authuser as JWTPayload;

    const authHeader = req.headers.authorization as string;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    const session = await this.sessionService.getSessionByToken(token);

    if (!session) {
      throw new Error('Session no encontrada');
    }

    // 1) Borrar todas las sesiones menos la actual (tu lógica actual)
    await this.sessionService.deleteAllSessionsExceptCurrent(
      userId,
      session._id.toString()
    );

    // 2) WebSockets: expulsar al resto de dispositivos del usuario
    //    El front enviará el id del socket actual en este header:
    //    "x-socket-id": socket.id
    const currentSocketId =
      (req.headers["x-socket-id"] as string | undefined) || undefined;

    forceLogoutUser(userId, currentSocketId);

    // 3) Respuesta igual que antes (puedes mejorar mensaje luego si quieres)
    res.status(200).json({
      success: true,
      message: 'Sesiónes eliminadas exitosamente',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    res.status(400).json({
      success: false,
      message: 'Error al eliminar sessiones',
      error: errorMessage
    });
  }
};


}

export const sessionController = new SessionController();