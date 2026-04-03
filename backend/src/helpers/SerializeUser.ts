import Queue from "../models/Queue";
import Company from "../models/Company";
import User from "../models/User";
import Setting from "../models/Setting";
import { getCompanyFinanceFlags, CompanyFinanceFlags } from "./companyFinanceStatus";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  companyId: number;
  company: Company | null;
  super: boolean;
  queues: Queue[];
  allTicket: string;
  finance: CompanyFinanceFlags;
}

export const SerializeUser = async (user: User): Promise<SerializedUser> => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    companyId: user.companyId,
    company: user.company,
    super: user.super,
    queues: user.queues,
    allTicket: user.allTicket,
    finance: user.company
      ? getCompanyFinanceFlags(user.company)
      : {
          overdue: false,
          delinquent: false,
          dueDate: null,
          daysPastDue: null
        }
  };
};
