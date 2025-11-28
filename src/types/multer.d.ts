import type { RequestHandler } from "express";

declare module "multer" {
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }

  export class MulterError extends Error {
    code: string;
    constructor(code: string, field?: string);
  }

  export interface StorageEngine {}
  export interface MulterOptions {
    storage?: StorageEngine;
    limits?: { fileSize?: number };
  }

  interface MulterInstance {
    single(field: string): RequestHandler;
  }

  function multer(options?: MulterOptions): MulterInstance;

  namespace multer {
    function memoryStorage(): StorageEngine;
  }

  export default multer;
}

declare namespace Express {
  namespace Multer {
    interface File extends import("multer").File {}
  }
}
