import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface ICita {
  proveedorId: Types.ObjectId;
  servicioId: Types.ObjectId;
  clienteId: Types.ObjectId;
  fecha: string;
  horario: {
    inicio: string;
    fin: string;
  };
  ubicacion?: {
    lat: number;
    lng: number;
    direccion?: string;
    notas?: string;
  };
  estado: "pendiente" | "confirmada" | "cancelada";
  createdAt?: Date;
  updatedAt?: Date;
}

export type CitaDocument = Document & ICita;

const CitaSchema = new Schema<CitaDocument>(
  {
    proveedorId: { type: Schema.Types.ObjectId, ref: "Fixer", required: true },
    servicioId: { type: Schema.Types.ObjectId, ref: "Servicio", required: true },
    clienteId: { type: Schema.Types.ObjectId, ref: "Cliente", required: true },
    fecha: { type: String, required: true },
    horario: {
      inicio: { type: String, required: true },
      fin: { type: String, required: true },
    },
    ubicacion: {
      lat: { type: Number },
      lng: { type: Number },
      direccion: { type: String },
      notas: { type: String },
    },
    estado: {
      type: String,
      enum: ["pendiente", "confirmada", "cancelada"],
      default: "pendiente",
    },
  },
  {
    timestamps: true,
    collection: "citas", // <-- usa la colección REAL
  }
);

// Reusar siempre el mismo modelo
const CitaModel: Model<CitaDocument> =
  (mongoose.models.Cita as Model<CitaDocument>) ||
  mongoose.model<CitaDocument>("Cita", CitaSchema, "citas");

export default CitaModel;
