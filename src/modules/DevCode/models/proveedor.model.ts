import mongoose, { Schema, model, Model, Document } from "mongoose";

// Interfaces
export interface IRangoHorario {
  inicio: string;
  fin: string;
}

export interface IDiaLaboral {
  dia: number;
  activo: boolean;
  rangos: IRangoHorario[];
}

export interface IHorarioLaboral {
  modo: "diaria" | "semanal";
  dias: IDiaLaboral[];
  updatedAt?: Date;
}

export interface IServicioProveedor {
  nombre: string;
  descripcion?: string;
  duracion: number;
  precio: number;
  rating?: number;
}

export interface IDisponibilidad {
  dias: number[];
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

export interface IProveedor extends Document {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  password: string;
  servicios: IServicioProveedor[];
  horarioLaboral?: IHorarioLaboral;
  disponibilidad: IDisponibilidad;
  ubicacion?: {
    lat?: number;
    lng?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Sub-esquemas
const RangoHorarioSchema = new Schema<IRangoHorario>(
  {
    inicio: { type: String, required: true },
    fin: { type: String, required: true },
  },
  { _id: false }
);

const DiaLaboralSchema = new Schema<IDiaLaboral>(
  {
    dia: { type: Number, required: true },
    activo: { type: Boolean, default: false },
    rangos: { type: [RangoHorarioSchema], default: [] },
  },
  { _id: false }
);

const HorarioLaboralSchema = new Schema<IHorarioLaboral>(
  {
    modo: { type: String, enum: ["diaria", "semanal"], required: true },
    dias: { type: [DiaLaboralSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ServicioSchema = new Schema<IServicioProveedor>(
  {
    nombre: { type: String, required: true },
    descripcion: { type: String },
    duracion: { type: Number, required: true },
    precio: { type: Number, required: true },
    rating: { type: Number, default: 0 },
  },
  { _id: false }
);

const DisponibilidadSchema = new Schema<IDisponibilidad>(
  {
    dias: { type: [Number], required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
    duracionTurno: { type: Number, required: true },
  },
  { _id: false }
);

// Modelo principal
const ProveedorSchema = new Schema<IProveedor>(
  {
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    telefono: { type: String },

    password: { type: String, required: true },

    servicios: { type: [ServicioSchema], default: [] },

    horarioLaboral: { type: HorarioLaboralSchema },

    disponibilidad: { type: DisponibilidadSchema, required: true },

    ubicacion: {
      lat: Number,
      lng: Number,
    },
  },
  {
    timestamps: true,
    collection: "proveedors", // <-- nombre REAL de la colección en la base
  }
);

// Reusar modelo si ya existe
const Proveedor: Model<IProveedor> =
  (mongoose.models.Proveedor as Model<IProveedor>) ||
  model<IProveedor>("Proveedor", ProveedorSchema, "proveedors"); // <-- siempre usar la colección real

export default Proveedor;
