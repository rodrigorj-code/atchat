import type Whatsapp from "../models/Whatsapp";

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        profile: string;
        companyId: number;
        supportMode?: boolean;
        supportHomeCompanyId?: number;
      };
      apiWhatsapp?: Whatsapp;
    }
  }
}

export {};
