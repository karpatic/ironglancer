import { formatCurrency } from './formatting.js';

export function estimateItemCost(item) {
  return roundMoney(item.quantity * item.unitPrice);
}

export function calculateShoppingTotal(items) {
  return roundMoney(items.reduce((total, item) => total + estimateItemCost(item), 0));
}

export function calculateCategoryTotals(items) {
  return items.reduce((totals, item) => {
    const category = item.category || 'Other';
    totals[category] = roundMoney((totals[category] || 0) + estimateItemCost(item));
    return totals;
  }, {});
}

export function describeBudget(total, budget) {
  const remaining = roundMoney(budget - total);
  if (remaining >= 0) return formatCurrency(remaining) + ' under target';
  return formatCurrency(Math.abs(remaining)) + ' over target';
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
