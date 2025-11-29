import { Request, Response } from 'express';
import * as recargaService from '../services/recarga.service';
import { sendWhatsApp } from '../services/notificacion.service';

export const crearRecarga = async (req: Request, res: Response) => {
  try {
    const { nombre, detalle, monto, correo, telefono, tipoDocumento, numeroDocumento, fixerId } = req.body;

    // Validación básica: Monto y al menos un método de identificación
    if (!monto || monto <= 0) {
      return res.status(400).json({ success: false, message: "El monto debe ser mayor a 0." });
    }
    
    // Si no hay fixerId, exigimos correo o telefono
    if (!fixerId && !correo && !telefono) {
      return res.status(400).json({ success: false, message: "Falta identificador de usuario (fixerId, correo o teléfono)." });
    }

    // Llamada al servicio transaccional
    const resultado = await recargaService.crearRecarga({
      nombre,
      detalle,
      monto,
      correo,
      telefono,
      tipoDocumento,
      numeroDocumento,
      fixerId, // ⬅️ PASAMOS EL ID AL SERVICIO
    } as any);

    // Enviar WhatsApp (Opcional)
    if (telefono) {
        sendWhatsApp(telefono, `✅ Recarga exitosa de Bs. ${monto}. Nuevo saldo: Bs. ${resultado.nuevoSaldo}`)
        .catch(err => console.error("No se pudo enviar WS:", err));
    }

    return res.status(201).json({
      success: true,
      message: "Recarga realizada correctamente.",
      data: resultado.recarga,
      nuevo_saldo: resultado.nuevoSaldo
    });

  } catch (error: any) {
    console.error("Error en crearRecarga:", error.message);
    
    if (error.message.includes("No se encontró") || error.message.includes("No hay datos")) {
        return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: "Error interno al procesar la recarga." });
  }
};

export const obtenerRecargas = async (req: Request, res: Response) => {
  try {
    const recargas = await recargaService.obtenerRecargas();
    return res.status(200).json({ success: true, data: recargas });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Error al obtener recargas" });
  }
};