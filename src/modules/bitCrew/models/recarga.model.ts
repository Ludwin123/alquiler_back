import mongoose, { Schema, Document } from "mongoose";

// Interfaz TypeScript para Recarga
export interface IRecarga extends Document {
  nombre: string;
  detalle: string;
  monto: number;
  correo: string;
  telefono: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fixerId?: string; // 🆕 Nuevo campo útil para relacionar directamente
  fecha: Date;
}

// Esquema Recarga
const RecargaSchema = new Schema<IRecarga>({
  nombre: { type: String, required: true },
  detalle: { type: String, required: true },
  monto: { type: Number, required: true },
  correo: { type: String, required: true },
  telefono: { type: String, required: true },
  tipoDocumento: { type: String, required: true },
  numeroDocumento: { type: String, required: true },
  fixerId: { type: String }, // Guardamos el ID del fixer si lo tenemos
  fecha: { type: Date, default: Date.now },
}, {
  collection: "recargas", // Nombre estándar en plural
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Evitar recompilación del modelo
export const Recarga = mongoose.models.Recarga || mongoose.model<IRecarga>("Recarga", RecargaSchema);
export default Recarga;