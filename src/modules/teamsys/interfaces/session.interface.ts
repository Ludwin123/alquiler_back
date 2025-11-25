import mongoose from "mongoose";

export interface IDeviceInfo {
  userAgent: string;
  ip: string;
  browser?: string;
  os?: string;
  device?: string;

  deviceType?: string;     // mobile | tablet | desktop | etc.
  deviceVendor?: string;   // Samsung, Apple, Xiaomi, etc.
  deviceModel?: string;    // SM-A146M, iPhone 12, etc.
  cpuArch?: string;        // arm64, x64, etc.
  engine?: string;         // WebKit, Blink, Gecko, etc.
  raw?: any;               // para guardar metadata completa sin parsear
}

export interface ILocation {
  country?: string;
  city?: string;

  lat?: number;
  lng?: number;
}

export interface ISession {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  refreshToken?: string;
  deviceInfo: IDeviceInfo;
  location?: ILocation;
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
