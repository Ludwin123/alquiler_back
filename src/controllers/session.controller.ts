import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import  Session  from "../models/session.model";

export class SessionController extends BaseController {
  constructor() {
    super(Session);
  }

  // 🧭 Buscar sesiones activas por usuario
  async getActiveByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const sessions = await this.model.find({ userId, isActive: true });
      res.json(sessions);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // 🔒 Cerrar sesión (marcar inactiva)
  async deactivateSession(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await this.model.findByIdAndUpdate(
        id,
        { isActive: false, lastActivity: new Date() },
        { new: true }
      );
      if (!updated) {
        res.status(404).json({ message: "Sesión no encontrada" });
        return;
      }
      res.json({ message: "Sesión desactivada", session: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // 🕓 Actualizar actividad (último uso)
  async updateActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updated = await this.model.findByIdAndUpdate(
        id,
        { lastActivity: new Date() },
        { new: true }
      );
      if (!updated) {
        res.status(404).json({ message: "Sesión no encontrada" });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const sessionController = new SessionController();
