import Company from "../models/Company";

export interface CompanyFinanceFlags {
  /** Data de vencimento da assinatura/cobrança já passou (comparado ao início do dia). */
  overdue: boolean;
  /** Mesmo critério que overdue — linguagem de produto (inadimplência). */
  delinquent: boolean;
  dueDate: string | null;
  /** Dias após o vencimento quando em atraso; null se não aplicável. */
  daysPastDue: number | null;
}

/**
 * Política V1 (Fase 2): inadimplência derivada de company.dueDate.
 * Não bloqueia login; flags alimentam UI e futuras regras de bloqueio parcial.
 */
export const getCompanyFinanceFlags = (company: Company): CompanyFinanceFlags => {
  if (!company?.dueDate) {
    return {
      overdue: false,
      delinquent: false,
      dueDate: null,
      daysPastDue: null
    };
  }
  const due = new Date(company.dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const overdue = due < today;
  const diffMs = today.getTime() - due.getTime();
  const daysPastDue =
    overdue && diffMs > 0 ? Math.max(0, Math.floor(diffMs / 86400000)) : null;

  return {
    overdue,
    delinquent: overdue,
    dueDate: company.dueDate,
    daysPastDue
  };
};
