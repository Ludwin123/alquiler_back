import { Schema, model, models, Document, Types } from "mongoose";

export type PaymentMethod = "card" | "qr" | "cash";

export type Location = {
  lat: number;
  lng: number;
  address?: string;
};

export type PaymentAccount = {
  holder: string;
  accountNumber: string;
};

export type FixerSkill = {
  categoryId: string;
  customDescription?: string;
};

export type JobPosition = {
  _id: Types.ObjectId;
  positionName: string;
  journeyType: string;
  organization?: string;
  isCurrent: boolean;
  startDate: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type CertificationImage = {
  data: string;
  mimeType: string;
  size: number;
  originalName?: string;
};

export type Certification = {
  _id: Types.ObjectId;
  name: string;
  issuer: string;
  issueDate: Date;
  expirationDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  image: CertificationImage;
  createdAt?: Date;
  updatedAt?: Date;
};

export type WorkExperience = {
  jobPositions: JobPosition[];
  certifications: Certification[];
  updatedAt?: Date;
};

const LocationSchema = new Schema<Location>(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true, maxlength: 255 },
  },
  { _id: false }
);

const PaymentAccountSchema = new Schema<PaymentAccount>(
  {
    holder: { type: String, trim: true, maxlength: 120 },
    accountNumber: { type: String, trim: true, maxlength: 40 },
  },
  { _id: false }
);

const FixerSkillSchema = new Schema<FixerSkill>(
  {
    categoryId: { type: String, required: true, trim: true },
    customDescription: { type: String, trim: true, maxlength: 800 },
  },
  { _id: false }
);

const JobPositionSchema = new Schema<JobPosition>(
  {
    positionName: { type: String, required: true, trim: true, maxlength: 120 },
    journeyType: { type: String, required: true, trim: true, maxlength: 80 },
    organization: { type: String, trim: true, maxlength: 160 },
    isCurrent: { type: Boolean, default: false },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
  },
  { timestamps: true }
);

const CertificationImageSchema = new Schema<CertificationImage>(
  {
    data: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    originalName: { type: String },
  },
  { _id: false }
);

const CertificationSchema = new Schema<Certification>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    issuer: { type: String, required: true, trim: true, maxlength: 160 },
    issueDate: { type: Date, required: true },
    expirationDate: { type: Date },
    credentialId: { type: String, trim: true, maxlength: 120 },
    credentialUrl: { type: String, trim: true, maxlength: 512 },
    image: { type: CertificationImageSchema, required: true },
  },
  { timestamps: true }
);

const WorkExperienceSchema = new Schema<WorkExperience>(
  {
    jobPositions: { type: [JobPositionSchema], default: [] },
    certifications: { type: [CertificationSchema], default: [] },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export interface FixerDoc extends Document {
  fixerId: string;
  userId: string;
  ci: string;
  name?: string;
  city?: string;
  photoUrl?: string;
  whatsapp?: string;
  bio?: string;
  location?: Location;
  categories: string[];
  skills: FixerSkill[];
  paymentMethods: PaymentMethod[];
  paymentAccounts: Partial<Record<PaymentMethod, PaymentAccount>>;
  termsAccepted: boolean;
  jobsCount: number;
  ratingAvg: number;
  ratingCount: number;
  memberSince?: Date;
  workExperience?: WorkExperience;
  createdAt: Date;
  updatedAt: Date;
}

const FixerSchema = new Schema<FixerDoc>(
  {
    fixerId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    ci: { type: String, required: true, unique: true },
    name: { type: String, trim: true, maxlength: 120 },
    city: { type: String, trim: true, maxlength: 120 },
    photoUrl: { type: String, trim: true },
    whatsapp: { type: String, trim: true, maxlength: 32 },
    bio: { type: String, trim: true, maxlength: 600 },
    location: { type: LocationSchema, required: false },
    categories: { type: [String], default: [] },
    paymentMethods: {
      type: [String],
      enum: ["card", "qr", "cash"],
      default: [],
    },
    skills: { type: [FixerSkillSchema], default: [] },
    paymentAccounts: {
      type: Map,
      of: PaymentAccountSchema,
      default: {},
    },
    termsAccepted: { type: Boolean, default: false },
    jobsCount: { type: Number, default: 0, min: 0 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    memberSince: { type: Date },
    workExperience: {
      type: WorkExperienceSchema,
      default: () => ({
        jobPositions: [],
        certifications: [],
        updatedAt: new Date(),
      }),
    },
  },
  {
    timestamps: true,
    collection: "fixers",
  }
);

FixerSchema.set("toJSON", { virtuals: true, versionKey: false });
FixerSchema.set("toObject", { virtuals: true, versionKey: false });

// Usa nombres unicos para no colisionar con otros modelos `Fixer` definidos por otros equipos.
const FIXER_MODEL_NAME = "FixerProfile";
const FIXER_COLLECTION_NAME = "fixer_profiles";

export const FixerModel =
  models[FIXER_MODEL_NAME] ?? model<FixerDoc>(FIXER_MODEL_NAME, FixerSchema, FIXER_COLLECTION_NAME);

