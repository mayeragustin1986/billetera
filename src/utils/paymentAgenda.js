export function getPendingPayments(transactions) {
  return transactions
    .filter((transaction) => transaction.status === "pending" && transaction.due_date)
    .sort((left, right) => left.due_date.localeCompare(right.due_date));
}

export function groupPaymentsByDueDate(transactions) {
  const groups = new Map();

  for (const payment of getPendingPayments(transactions)) {
    const current = groups.get(payment.due_date) || {
      date: payment.due_date,
      total: 0,
      payments: [],
    };
    current.total += Number(payment.amount);
    current.payments.push(payment);
    groups.set(payment.due_date, current);
  }

  return [...groups.values()];
}
