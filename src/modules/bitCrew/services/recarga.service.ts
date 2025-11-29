import mongoose from 'mongoose';
import { Recarga, IRecarga } from '../models/recarga.model';
import { Wallet } from '../../../models/wallet.model';
import { Transaccion } from '../../../models/transaccion.model';
import { Fixer } from '../../../models/fixer.model'; 

export const crearRecarga = async (data: IRecarga) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("[RecargaService] Procesando recarga...", data);

    const datosEntrada = data as any;
    const query: any[] = [];
    
    // 1. Prioridad: Buscar por fixerId
    if (datosEntrada.fixerId) {
       query.push({ fixerId: datosEntrada.fixerId });
    }
    
    // 2. Fallback: Buscar por contacto
    if (data.correo) query.push({ email: data.correo });
    if (data.telefono) query.push({ whatsapp: data.telefono });

    if (query.length === 0) {
        throw new Error("No hay datos suficientes para identificar al usuario.");
    }

    // Buscamos al Fixer
    const fixer = await Fixer.findOne({ $or: query }).session(session);

    if (!fixer) {
      throw new Error(`No se encontró al Fixer con los datos proporcionados.`);
    }

    // 3. Buscar Billetera (usando fixer.fixerId)
    let wallet = await Wallet.findOne({ fixer_id: fixer.fixerId }).session(session);

    // Auto-crear billetera si no existe
    if (!wallet) {
      console.log(`[RecargaService] Creando billetera nueva para ${fixer.name}`);
      wallet = new Wallet({
        fixer_id: fixer.fixerId,
        saldo: 0,
        estado: 'activa',
        fecha_actualizacion: new Date(),
        moneda: 'Bs'
      });
      await wallet.save({ session });
    }

    // 4. Crear Recarga
    const nuevaRecarga = new Recarga({
        ...data,
        fixerId: fixer.fixerId
    });
    
    // 5. Actualizar Saldo
    const montoNum = Number(data.monto);
    wallet.saldo = (wallet.saldo || 0) + montoNum;
    wallet.fecha_actualizacion = new Date();

    if (wallet.saldo > 0 && wallet.estado === 'bloqueada') {
      wallet.estado = 'activa';
    }

    // 6. Crear Transacción
    const nuevaTransaccion = new Transaccion({
      id_deuda: nuevaRecarga._id,
      cuentaId: wallet._id,
      tipo: "ingreso",
      monto: montoNum,
      descripcion: `Recarga QR: ${data.detalle || 'Saldo'}`,
      fecha_pago: new Date(),
      forma_pago: "QR",
      url_pasarela_pagos: "QR_PAYMENT",
      facturas: []
    });

    await nuevaRecarga.save({ session });
    await wallet.save({ session });
    await nuevaTransaccion.save({ session });

    await session.commitTransaction();
    
    return { 
        recarga: nuevaRecarga, 
        nuevoSaldo: wallet.saldo, 
        fixer: { name: fixer.name } 
    }; 

  } catch (error: any) {
    await session.abortTransaction();
    console.error("❌ Error Recarga Service:", error.message);
    throw error; 
  } finally {
    session.endSession();
  }
};

export const obtenerRecargas = async () => {
  return await Recarga.find().sort({ fecha: -1 });
};