import { Request, Response } from 'express';
import * as walletService from '../services/wallet.service';
import { Types } from 'mongoose';

export const handleGetBilleteraByFixerId = async (req: Request, res: Response) => {
  const { id } = req.params; // Este es el ID del Fixer

  try {
    if (!Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'ID de Fixer no válido' });
    }

    console.log(`[WalletController] Procesando billetera para Fixer ID: ${id}`);

    // 1. Llamamos al servicio que busca o crea la billetera
    const billetera = await walletService.getOrCreateWallet(id);

    // 2. (Opcional) Verificamos estado actual. 
    // Nota: Si acabamos de crearla con 0, verifica si tu lógica la bloquea.
    const billeteraActualizada = await walletService.checkAndUpdateBilleteraStatus(billetera._id as Types.ObjectId);

    // 3. Respondemos al frontend
    return res.status(200).json({
      success: true,
      billetera: billeteraActualizada
    });

  } catch (error: any) {
    console.error(`Error en WalletController: ${error.message}`);
    
    if (error.message.includes("El Fixer no existe")) {
        return res.status(404).json({ success: false, message: error.message });
    }

    return res.status(500).json({ success: false, message: 'Error interno del servidor al obtener la billetera' });
  }
};