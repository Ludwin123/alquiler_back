import mongoose, { Schema, model, Model, Document } from "mongoose";

export interface ICliente extends Document {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
  carnet_identidad?: string;
  metodo_pago?: string;
  ubicacion?: {
    lat?: number;
    lng?: number;
    direccion?: string;
  };
  createdAt?: Date;
}

const ClienteSchema = new Schema<ICliente>(
  {
    nombre: { type: String, required: true },
    correo: { type: String, required: true },
    telefono: { type: String, required: true },
    contrasena: { type: String, required: true },

    carnet_identidad: { type: String },
    metodo_pago: { type: String },

    ubicacion: {
      lat: { type: Number },
      lng: { type: Number },
      direccion: { type: String },
    },
  },
  {
    collection: "clientes", // <-- nombre REAL de la base
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Reusar modelo si ya existe
const Cliente: Model<ICliente> =
  (mongoose.models.Cliente as Model<ICliente>) ||
  model<ICliente>("Cliente", ClienteSchema, "clientes"); // <-- siempre usar la misma colección

export default Cliente;
