import { Request, Response } from 'express';
import * as transaccionService from '../services/transaccion.service';

export const handleGetTransaccionesByFixerId = async (req: Request, res: Response) => {
  const { id } = req.params; // ⬅️ Recibimos el ID

  try {
    // Ya no necesitamos buscar al fixer por usuario, usamos el ID directo
    const transacciones = await transaccionService.getTransaccionesByFixerId(id as any);

    res.status(200).json({
      success: true,
      transacciones: transacciones
    });

  } catch (error: any) {
    console.error(`Error en TransaccionController: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};