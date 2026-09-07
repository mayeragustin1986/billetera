import assert from "node:assert/strict";
import test from "node:test";
import { filterPaymentAgenda } from "./paymentAgenda.js";

test("only includes pending expenses with a due date", () => {
  const pendingExpense = { status: "pending", type: "expense", due_date: "2026-09-08", amount: 100 };
  const transactions = [
    pendingExpense,
    { status: "pending", type: "income", due_date: "2026-09-08", amount: 900 },
    { status: "paid", type: "expense", due_date: "2026-09-08", amount: 200 },
    { status: "pending", type: "expense", due_date: null, amount: 300 },
    { status: "pending", type: "expense", due_date: "", amount: 400 },
  ];

  const agenda = filterPaymentAgenda(transactions);

  assert.deepEqual(agenda, [pendingExpense]);
  assert.equal(agenda.reduce((total, transaction) => total + transaction.amount, 0), 100);
});
