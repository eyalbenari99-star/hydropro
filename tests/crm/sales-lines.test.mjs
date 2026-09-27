// v21.13 Customer Analytics: the nexi-qb worker's sales-line normalisation.
// Run: node --test tests/crm/sales-lines.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { salesLines } from '../../workers/quickbooks-worker.js';

const inv = (lines, extra = {}) => ({ Id: '1', DocNumber: 'INV-1', TxnDate: '2026-09-15',
  CustomerRef: { value: '42', name: 'Hotel A' }, Line: lines, ...extra });
const item = (id, qty, price, amt) => ({ DetailType: 'SalesItemLineDetail', Amount: amt,
  SalesItemLineDetail: { ItemRef: { value: id, name: 'Item ' + id }, Qty: qty, UnitPrice: price } });

test('invoice lines: net in centavos, subtotal and description lines skipped', () => {
  const L = salesLines(inv([item('1', 10, 40, 400), { DetailType: 'SubTotalLineDetail', Amount: 400 },
    { DetailType: 'DescriptionOnly', Description: 'note' }]), 'Invoice', 1);
  assert.equal(L.length, 1);
  assert.equal(L[0].net, 40000);
  assert.equal(L[0].qty, 10);
  assert.equal(L[0].customerId, '42');
});

test('document discount 100.00 over lines 300.00 + 700.00 leaves 270.00 + 630.00, adds up to the cent', () => {
  const L = salesLines(inv([item('1', 1, 300, 300), item('2', 1, 700, 700),
    { DetailType: 'DiscountLineDetail', Amount: 100, DiscountLineDetail: { PercentBased: false } }]), 'Invoice', 1);
  assert.deepEqual(L.map((l) => l.net), [27000, 63000]);
  assert.equal(L.reduce((a, l) => a + l.net, 0), 90000);
});

test('odd discount 0.10 over three equal lines: residual goes to one line, total stays 299.90', () => {
  const L = salesLines(inv([item('1', 1, 100, 100), item('2', 1, 100, 100), item('3', 1, 100, 100),
    { DetailType: 'DiscountLineDetail', Amount: 0.1 }]), 'Invoice', 1);
  assert.equal(L.reduce((a, l) => a + l.net, 0), 29990);
});

test('bundle (group) line is read through its children, never counted twice', () => {
  const L = salesLines(inv([{ DetailType: 'GroupLineDetail', Amount: 500,
    GroupLineDetail: { Line: [item('1', 2, 100, 200), item('2', 3, 100, 300)] } }]), 'Invoice', 1);
  assert.equal(L.length, 2);
  assert.equal(L.reduce((a, l) => a + l.net, 0), 50000);
});

test('credit memo 5 kg x 40.00 comes back negative: qty -5, net -200.00', () => {
  const L = salesLines(inv([item('1', 5, 40, 200)]), 'CreditMemo', -1);
  assert.equal(L[0].qty, -5);
  assert.equal(L[0].net, -20000);
});

test('USD invoice 10.00 at rate 56.5 keeps USD net and PHP base 565.00, never mixed', () => {
  const L = salesLines(inv([item('1', 1, 10, 10)], { CurrencyRef: { value: 'USD' }, ExchangeRate: 56.5 }), 'Invoice', 1);
  assert.equal(L[0].currency, 'USD');
  assert.equal(L[0].net, 1000);
  assert.equal(L[0].baseNet, 56500);
});
