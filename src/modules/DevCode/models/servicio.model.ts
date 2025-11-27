import mongoose, { Schema, model, Types } from "mongoose";

export interface IServicio {
  nombre: string;
  descripcion: string;
  duracion?: number;
  precio?: number;
  rating?: number;
  proveedorId?: Types.ObjectId;
}

const ServicioSchema = new Schema<IServicio>(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    duracion: { type: Number },
    precio: { type: Number },
    rating: { type: Number },
    proveedorId: { type: Schema.Types.ObjectId, ref: "Proveedor" },
  },
  {
    collection: "servicios", // <-- usa la colección existente
  }
);

// Siempre usar el mismo modelo y la misma colección
const ServicioModel =
  mongoose.models.Servicio ||
  model<IServicio>("Servicio", ServicioSchema, "servicios");

export default ServicioModel;
