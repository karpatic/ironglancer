import { mealTemplatesForFocus } from '../data/seedPlan.js';
import { friendlyList } from './formatting.js';
import { applyOwnedState, groupNeededItems, normalizePantryItem, scaleItemForHousehold } from './pantry.js';
import { calculateCategoryTotals, calculateShoppingTotal, estimateItemCost } from './pricing.js';

export function buildShoppingPlan(plan, sourceItems) {
  const menu = mealTemplatesForFocus(plan.focus);
  const preparedItems = sourceItems
    .map(normalizePantryItem)
    .map((item) => scaleItemForHousehold(item, plan.householdSize));
  const items = applyOwnedState(preparedItems, plan.ownedItemIds);
  const neededItems = Object.values(groupNeededItems(items)).flat();
  const total = calculateShoppingTotal(neededItems);
  return {
    menu,
    items,
    neededItems,
    total,
    categoryTotals: calculateCategoryTotals(neededItems),
    recommendations: rankRestockItems(neededItems, plan.budget),
  };
}

export function rankRestockItems(items, budget) {
  return items
    .map((item) => ({
      ...item,
      score: scoreRestockItem(item, budget),
      reason: restockReason(item),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 4);
}

export function summarizeMenu(menu) {
  return friendlyList(menu.map((name) => ({ name })));
}

function scoreRestockItem(item, budget) {
  const pricePressure = estimateItemCost(item) / Math.max(1, budget);
  return Math.round((item.importance * 10) - (pricePressure * 12));
}

function restockReason(item) {
  if (item.category === 'Produce') return 'keeps meals fresh';
  if (item.category === 'Protein') return 'anchors dinner';
  if (item.importance >= 7) return 'used across the week';
  return 'fills a gap';
}
