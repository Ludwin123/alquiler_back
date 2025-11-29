import { Request, Response } from 'express';
import { Wallet } from '../../../models/wallet.model';
import { Fixer } from '../../../models/fixer.model'; 
import * as walletService from '../services/wallet.service';

export const handleGetBilleteraByFixerId = async (req: Request, res: Response) => {
  const { id } = req.params; // Recibimos el 'fixerId' (ej: 69287869...)

  try {
    console.log(`[WalletController] Buscando fixer con fixerId: ${id}`);

    // 1. CORRECCIÓN: Buscamos por el campo 'fixerId', NO por '_id'
    const fixerExists = await Fixer.findOne({ fixerId: id });
    
    if (!fixerExists) {
      console.log(`[WalletController] Fixer no encontrado en DB.`);
      return res.status(404).json({ success: false, message: 'Fixer no encontrado' });
    }

    // 2. Buscamos la billetera asociada a ese fixerId
    let billetera = await Wallet.findOne({ fixer_id: id });

    // 3. AUTO-CREACIÓN: Si no existe, la creamos
    if (!billetera) {
      console.log(`[WalletController] Creando billetera nueva...`);
      billetera = new Wallet({
        fixer_id: id,
        saldo: 0,
        estado: 'activa',
        fecha_actualizacion: new Date(),
        moneda: 'Bs'
      });
      await billetera.save();
    }

    // 4. Actualizar estado
    const billeteraActualizada = await walletService.checkAndUpdateBilleteraStatus(billetera._id as any);

    return res.status(200).json({
      success: true,
      billetera: billeteraActualizada
    });

  } catch (error: any) {
    console.error(`Error en WalletController: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};