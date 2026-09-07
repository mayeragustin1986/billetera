import test from "node:test";
import assert from "node:assert/strict";
import { getPaymentAgenda } from "./paymentAgenda.js";

test("excluye un ingreso pendiente de la agenda y de la deuda", () => {
  const expense = {
    id: "expense",
    type: "expense",
    status: "pending",
    due_date: "2026-09-10",
    amount: 250,
  };
  const pendingIncome = {
    id: "income",
    type: "income",
    status: "pending",
    due_date: "2026-09-09",
    amount: 900,
  };

  const agenda = getPaymentAgenda([expense, pendingIncome]);

  assert.equal(agenda.debt, 250);
  assert.deepEqual(agenda.payments, [expense]);
  assert.equal(agenda.groups.length, 1);
  assert.equal(agenda.groups[0].payments.includes(pendingIncome), false);
});

test("incluye solamente gastos pendientes que tienen vencimiento", () => {
  const valid = { id: "valid", type: "expense", status: "pending", due_date: "2026-09-10", amount: 80 };
  const paid = { id: "paid", type: "expense", status: "paid", due_date: "2026-09-10", amount: 40 };
  const undated = { id: "undated", type: "expense", status: "pending", due_date: null, amount: 20 };

  assert.deepEqual(getPaymentAgenda([undated, paid, valid]).payments, [valid]);
});
