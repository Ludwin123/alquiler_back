import mongoose, { Schema, model, InferSchemaType, HydratedDocument} from "mongoose";
import { ISession } from "../interfaces/session.interface";

const sessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User id is required'],
      index: true,
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
      index: true,
    },
    refreshToken: {
      type: String,
      sparse: true,
      index: true,
    },
    deviceInfo: {
      userAgent: {
        type: String,
        required: [true, 'user agent is required'],
      },
      ip: {
        type: String,
        required: [true, 'IP is required'],
      },
      browser: {
        type: String,
      },
      os: {
        type: String,
      },
      device: {
        type: String,
      },

      // Tipo de dispositivo: 'mobile' | 'tablet' | 'desktop' | etc.
      deviceType: {
        type: String,
      },
      // Marca del dispositivo: Samsung, Apple, Xiaomi, etc.
      deviceVendor: {
        type: String,
      },
      // Modelo del dispositivo: SM-A146M, iPhone 12, etc.
      deviceModel: {
        type: String,
      },
      // Arquitectura del CPU: arm64, x86_64, etc.
      cpuArch: {
        type: String,
      },
      // Engine del navegador: WebKit, Blink, Gecko, etc.
      engine: {
        type: String,
      },
      // (Opcional) Datos crudos extra si quieres guardarlos
      raw: {
        type: Schema.Types.Mixed,
      },
    },
    location: {
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expires at is required'],
      index: true,
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, createdAt: -1 });
sessionSchema.index({ token: 1, isActive: 1 });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export type Session = InferSchemaType<typeof sessionSchema>;
export type SessionDocument = HydratedDocument<Session>;
//export const Session: Model<ISession> = mongoose.model<ISession>('Session', sessionSchema);
export default model<Session>('Session', sessionSchema, 'sessions');
