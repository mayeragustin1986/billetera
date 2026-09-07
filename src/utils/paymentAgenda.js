export function isPendingExpense(transaction) {
  return (
    transaction.type === "expense" &&
    transaction.status === "pending" &&
    Boolean(transaction.due_date)
  );
}

export function getPaymentAgenda(transactions) {
  const payments = transactions
    .filter(isPendingExpense)
    .sort((a, b) => a.due_date.localeCompare(b.due_date));

  const debt = payments.reduce((total, payment) => total + Number(payment.amount), 0);
  const available = transactions
    .filter((transaction) => transaction.status === "paid")
    .reduce(
      (total, transaction) =>
        total + (transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount)),
      0,
    );

  const groups = payments.reduce((result, payment) => {
    const group = result.find(({ date }) => date === payment.due_date);
    if (group) group.payments.push(payment);
    else result.push({ date: payment.due_date, payments: [payment] });
    return result;
  }, []);

  return { available, debt, free: available - debt, groups, payments };
}
