import { Schema, model, Document, Types, InferSchemaType, HydratedDocument } from "mongoose";

export interface IUserAuth extends Document {
  userId: Types.ObjectId; // referencia a User
  authProvider: string; // ej. "local", "google"
  mapaModificacion: number; // número de cambios permitidos o nivel de acceso
  historialPassword:[string]
  createdAt: Date;
  updatedAt: Date;
}

const userAuthSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // un documento por usuario
    },

    authProvider: {
      type: [String],
      required: true
    },
    mapaModificacion:{
      type:Number,
      default:3,
      required:true
    },
    historialPassword:{
      type:[String],
      default:[]
    }
  },
  { timestamps: true }
);

export type UserAuth = InferSchemaType<typeof userAuthSchema>;
export type UserAuthDocument = HydratedDocument<UserAuth>;
export default  model<UserAuth>('UserAuth', userAuthSchema, 'user_auth');
