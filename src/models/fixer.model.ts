import mongoose, { Schema, Document, Types, Model } from "mongoose";

// 1️⃣ Rango horario
export interface IRangoHorario {
  inicio: string;
  fin: string;
}

// 2️⃣ Día laboral
export interface IDiaLaboral {
  dia: number;
  activo: boolean;
  rangos: IRangoHorario[];
}

// 3️⃣ Horario laboral completo
export interface IHorarioLaboral {
  modo: "diaria" | "semanal";
  dias: IDiaLaboral[];
  updatedAt?: Date;
}

// 4️⃣ Disponibilidad general
export interface IDisponibilidad {
  dias: number[];
  horaInicio: string;
  horaFin: string;
  duracionTurno: number;
}

// --- INTERFAZ PRINCIPAL (ADAPTADA A TU DB REAL) ---
export interface IFixer extends Document {
  // Campos de Identificación
  fixerId: string;      // ⚠️ Antes "usuario"
  userId: string;       // Nuevo campo visto en tu DB
  name: string;         // ⚠️ Antes "nombre"
  ci?: string;          // ⚠️ Antes "carnet_identidad"
  email?: string;       // Opcional si no venía en tu json
  hash_password?: string; // Opcional por si usas auth externa
  
  // Datos de Contacto y Perfil
  whatsapp?: string;    // ⚠️ Antes "telefono"
  photoUrl?: string;    // Nuevo
  city?: string;        // Nuevo
  location?: {          // ⚠️ Antes "ubicacion"
    lat: number;
    lng: number;
    address?: string;   // Antes "direccion"
  };
  
  // Listas (Arrays)
  categories?: any[];    // ⚠️ Antes "categorias"
  skills?: any[];        // ⚠️ Antes "especialidades"
  paymentMethods?: any[];// ⚠️ Antes "metodo_pago"

  // Metadatos
  active?: boolean;      // ⚠️ Antes "activo"
  memberSince?: Date;    // ⚠️ Antes "fecha_registro"
  termsAccepted?: boolean;
  
  // Estadísticas
  jobsCount?: number;
  ratingAvg?: number;    // ⚠️ Antes "rating_promedio"
  ratingCount?: number;  // ⚠️ Antes "reseñas_recibidas"

  // Sub-documentos (Mantenemos tu lógica anterior por si la usas a futuro)
  disponibilidad?: IDisponibilidad;
  horarioLaboral?: IHorarioLaboral;

  createdAt?: Date;
  updatedAt?: Date;
}

// --- SCHEMAS ---

const rangoHorarioSchema = new Schema<IRangoHorario>(
  { inicio: { type: String }, fin: { type: String } },
  { _id: false }
);

const diaLaboralSchema = new Schema<IDiaLaboral>(
  {
    dia: { type: Number },
    activo: { type: Boolean, default: true },
    rangos: [rangoHorarioSchema],
  },
  { _id: false }
);

const horarioLaboralSchema = new Schema<IHorarioLaboral>(
  {
    modo: { type: String, enum: ["diaria", "semanal"] },
    dias: [diaLaboralSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const disponibilidadSchema = new Schema<IDisponibilidad>(
  {
    dias: [{ type: Number }],
    horaInicio: { type: String },
    horaFin: { type: String },
    duracionTurno: { type: Number },
  },
  { _id: false }
);

// --- SCHEMA PRINCIPAL FIXER ---
const fixerSchema = new Schema<IFixer>(
  {
    // Identificadores
    fixerId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    ci: { type: String },
    email: { type: String },
    hash_password: { type: String },

    // Contacto
    whatsapp: { type: String }, // IMPORTANTE: Este campo es el que usamos para notificaciones
    photoUrl: { type: String },
    city: { type: String },
    
    // Ubicación (Mapeado a 'location' en la DB)
    location: {
      lat: Number,
      lng: Number,
      address: String,
    },

    // Arrays (Usamos Mixed o ObjectId según lo que guardes realmente)
    categories: [{ type: Schema.Types.Mixed }], 
    skills: [{ type: Schema.Types.Mixed }],
    paymentMethods: [{ type: Schema.Types.Mixed }],

    // Estado
    active: { type: Boolean, default: true },
    memberSince: { type: Date, default: Date.now },
    termsAccepted: { type: Boolean, default: false },

    // Estadísticas
    jobsCount: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // Lógica de Negocio Extra
    disponibilidad: disponibilidadSchema,
    horarioLaboral: horarioLaboralSchema,
  },
  { 
    timestamps: true, // Maneja createdAt y updatedAt automáticamente
    collection: 'fixers', // Forzamos el nombre de la colección tal cual está en Mongo
    strict: false // 💡 TRUCO: Permite guardar campos extra que no estén en el esquema si la DB cambia
  } 
);

// Evitar recompilación del modelo en Next.js/Hot Reload
const FixerModel: Model<IFixer> = mongoose.models.Fixer || mongoose.model<IFixer>("Fixer", fixerSchema);

export default FixerModel;
export { FixerModel as Fixer };