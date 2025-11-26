// src/types/index.ts      prueba
export interface IUser {
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

//export interface CustomRequest extends Request {
  //user?: IUser;
//}