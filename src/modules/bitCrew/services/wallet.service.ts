import { Types } from "mongoose";
import { Wallet, IWallet } from "../../../models/wallet.model";
import { Fixer } from "../../../models/fixer.model"; 

// Esta función busca la billetera usando el campo fixer_id (que coincide con tu fixerId)
export const getBilleteraByFixerId = async (fixerId: string): Promise<IWallet | null> => {
  // Nota: Si en tu modelo Wallet 'fixer_id' es ObjectId, usa new Types.ObjectId(fixerId)
  // Si es string, déjalo así. Asumiremos string o ObjectId automático según tu esquema.
  return Wallet.findOne({ fixer_id: fixerId });
};

// --- FUNCIÓN CORREGIDA: BUSCAR O CREAR ---
export const getOrCreateWallet = async (fixerIdString: string): Promise<IWallet> => {
  
  // 1. Intentamos buscar la billetera existente
  // (Dependiendo de cómo definiste el Schema de Wallet, fixer_id puede ser String o ObjectId)
  let billetera = await Wallet.findOne({ fixer_id: fixerIdString });

  // 2. Si existe, la retornamos
  if (billetera) {
    return billetera;
  }

  // 3. Si NO existe, verificamos que el Fixer sea válido.
  // CORRECCIÓN AQUÍ: Usamos findOne buscando por el campo "fixerId", NO findById
  const fixerExists = await Fixer.findOne({ fixerId: fixerIdString });
  
  if (!fixerExists) {
    // Si llegamos aquí, es que el ID no está ni en _id ni en fixerId
    throw new Error(`El Fixer con ID ${fixerIdString} no existe, no se puede crear la billetera.`);
  }

  console.log(`[WalletService] Creando nueva billetera para Fixer: ${fixerIdString}`);
  
  // 4. Creamos la billetera con saldo 0
  billetera = new Wallet({
    fixer_id: fixerIdString, // Guardamos el ID que usas para relacionar
    saldo: 0,
    estado: 'activa',
    fecha_actualizacion: new Date(),
    moneda: 'Bs'
  });

  await billetera.save();
  return billetera;
};

export const checkAndUpdateBilleteraStatus = async (billeteraId: Types.ObjectId): Promise<IWallet | null> => {
  try {
    const billetera = await Wallet.findById(billeteraId);

    if (!billetera) {
      throw new Error("No se encontró la billetera para actualizar.");
    }

    let nuevoEstado: "activa" | "bloqueada";

    // Si el saldo es menor a 0, se bloquea (saldo 0 sigue activa)
    if (billetera.saldo < 0) {
      nuevoEstado = "bloqueada";
      console.log(`[ALERTA] Billetera de fixer '${billetera.fixer_id}' BLOQUEADA (saldo: ${billetera.saldo}).`);
    } else {
      nuevoEstado = "activa";
    }

    if (billetera.estado !== nuevoEstado) {
      billetera.estado = nuevoEstado; // @ts-ignore
      billetera.fecha_actualizacion = new Date();
      await billetera.save();
      console.log(`[Servicio] Estado de billetera actualizado a: ${nuevoEstado}`);
    }

    return billetera;
  } catch (error: any) {
    console.error("Error en checkAndUpdateBilleteraStatus:", error.message);
    throw new Error("Error al actualizar el estado de la billetera");
  }
};