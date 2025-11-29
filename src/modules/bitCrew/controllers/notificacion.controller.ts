import { Request, Response } from "express";
import { Fixer } from "../../../models/fixer.model"; // Importamos el nuevo modelo
import { sendWhatsApp } from "../services/notificacion.service";

export const notificarSaldoBajo = async (req: Request, res: Response) => {
  try {
    const { usuario, saldo } = req.body; // 'usuario' aquí trae el ID

    // 1. Buscamos por fixerId
    const fixer = await Fixer.findOne({ fixerId: usuario });
    
    if (!fixer) {
      return res.status(404).json({ success: false, message: "Fixer no encontrado" });
    }

    // 2. CORREGIDO: Usamos 'whatsapp' en vez de 'telefono'
    if (!fixer.whatsapp) {
      return res.status(400).json({ 
        success: false, 
        message: "El Fixer no tiene número de WhatsApp registrado." 
      });
    }

    // 3. CORREGIDO: Usamos 'name' en vez de 'nombre'
    const mensaje = `⚠️ Hola ${fixer.name}, tu cuenta ha sido restringida porque tu saldo de Bs. ${saldo} es inferior al límite permitido.`;

    await sendWhatsApp(fixer.whatsapp, mensaje);

    return res.json({
      success: true,
      message: "Notificación enviada correctamente.",
    });
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al enviar notificación.",
    });
  }
};

