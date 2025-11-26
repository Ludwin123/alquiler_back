import mongoose, { Schema, Document, model,InferSchemaType, HydratedDocument} from "mongoose";

export interface IUser extends Document {
  nombre: string;
  apellido?: string;
  telefono?: string;
  correo: string;
  password?: string;
  contraseña?: string;
  fotoPerfil?: string;
  foto_perfil?: string;
  ubicacion?: {
    type: "Point";
    coordinates: [number, number];
  };
  terminosYCondiciones?: boolean;
  authProvider?: string;
  googleId?: string;
  rol?: "cliente" | "proveedor" | "admin" | string;
  roles?: string[];
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  twoFactorBackupCodes?: string[];
  fecha_creacion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    nombre: { type: String,
      required: [true, 'El nombre es requerido'], trim: true },
    apellido: { type: String, trim: true },
    telefono: { type: String, trim: true },

    correo: {
      type: String,
      required: [true, 'El correo electrónico es requerido'],
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      // No obligatorio: usuarios de Google no la tienen
    },

    fotoPerfil: {
      type: String, // o String si usas URL
      required: [true, 'La foto de perfil es obligatoria para todos los usuarios'],
    },

    ubicacion: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitud, latitud]
        required: [true, 'La ubicación es obligatoria para todos los usuarios'],
      },
    },

    terminosYCondiciones: { type: Boolean },

    // === OAuth ===
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    googleId: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },

    // === Rol ===
    rol: {
      type: [String],
      default: ['requester'], // todos los nuevos usuarios serán requester
      required: true,
    },
    twoFactorSecret: {
      type: String,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorBackupCodes: {
      type: [String],
      default: [],
    }
  },
  { timestamps: true }
);

// Índices
userSchema.index({ ubicacion: '2dsphere' });
userSchema.index({ correo: 1 }, { unique: true });

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;
export default model<User>('User', userSchema, 'users');
