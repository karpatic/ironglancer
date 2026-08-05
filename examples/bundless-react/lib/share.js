import { formatCurrency, formatQuantity } from './formatting.js';

export async function copyPlanToClipboard({ plan, shoppingPlan }) {
  const text = buildShareText({ plan, shoppingPlan });
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return { copied: true, message: 'Copied shopping list.' };
  }
  return { copied: false, message: text };
}

export function buildShareText({ plan, shoppingPlan }) {
  const lines = [
    'Pantry Week Planner',
    'Budget: ' + formatCurrency(plan.budget),
    'Estimated list: ' + formatCurrency(shoppingPlan.total),
    '',
    ...shoppingPlan.neededItems.map(itemLine),
  ];
  return lines.join('\n');
}

function itemLine(item) {
  return '- ' + item.name + ': ' + formatQuantity(item) + ' (' + formatCurrency(item.quantity * item.unitPrice) + ')';
}
