export const isPaymentAgendaItem = (transaction) =>
  transaction.status === "pending" &&
  transaction.type === "expense" &&
  transaction.due_date != null &&
  transaction.due_date !== "";

export const filterPaymentAgenda = (transactions) =>
  transactions.filter(isPaymentAgendaItem);
