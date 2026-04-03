import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email?: string | null;
    phone?: string | null;
    role?: string;
  };
}
