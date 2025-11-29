import { Fixer, IFixer } from "../../../models/fixer.model";

export const getAllFixers = async (): Promise<IFixer[]> => {
  try {
    return await Fixer.find();
  } catch (error: any) {
    console.error("Error en servicio - getAllFixers:", error);
    throw new Error("Error al obtener fixers");
  }
};

// ⚠️ CORREGIDO: Adaptado al nuevo modelo (fixerId)
export const getFixerByUsuario = async (id: string): Promise<IFixer | null> => {
  try {
    // Tu DB usa 'fixerId', no 'usuario'
    return await Fixer.findOne({ fixerId: id });
  } catch (error: any) {
    console.error("Error en servicio - getFixerByUsuario:", error);
    throw new Error("Error al buscar fixer");
  }
};

// ⚠️ CORREGIDO: Búsqueda por ID directo
export const getFixerById = async (id: string): Promise<IFixer | null> => {
  try {
    // Primero intentamos por fixerId (el string largo)
    let fixer = await Fixer.findOne({ fixerId: id });
    
    // Si no encuentra, intentamos por _id de Mongo (por si acaso)
    if (!fixer) {
        try {
            fixer = await Fixer.findById(id);
        } catch (e) { /* ignorar error de cast */ }
    }
    return fixer;
  } catch (error: any) {
    console.error("Error en servicio - getFixerById:", error);
    throw new Error("Error al buscar fixer por ID");
  }
};