/**
 * Espelha a lógica de backend (companyFinanceStatus) para atualizar user.finance no cliente.
 */
export function computeFinanceFromDueDate(dueDate) {
  if (!dueDate) {
    return {
      overdue: false,
      delinquent: false,
      dueDate: null,
      daysPastDue: null,
    };
  }
  const due = new Date(dueDate);
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
    dueDate,
    daysPastDue,
  };
}
