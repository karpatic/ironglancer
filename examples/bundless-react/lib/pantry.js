export function normalizePantryItem(item) {
  return {
    ...item,
    quantity: roundQuantity(item.quantity),
    unitPrice: roundMoney(item.unitPrice),
    importance: Math.max(1, item.importance || 1),
  };
}

export function scaleItemForHousehold(item, householdSize) {
  const multiplier = householdMultiplier(householdSize);
  return {
    ...item,
    quantity: roundQuantity(item.quantity * multiplier),
  };
}

export function applyOwnedState(items, ownedItemIds) {
  const owned = new Set(ownedItemIds || []);
  return items.map((item) => ({
    ...item,
    owned: owned.has(item.id),
  }));
}

export function groupNeededItems(items) {
  return items.reduce((groups, item) => {
    if (item.owned) return groups;
    const category = item.category || 'Other';
    groups[category] = groups[category] || [];
    groups[category].push(item);
    return groups;
  }, {});
}

function householdMultiplier(householdSize) {
  const people = Math.max(1, Number(householdSize) || 1);
  return Math.max(0.6, people / 3);
}

function roundQuantity(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
