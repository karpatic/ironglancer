export function formatCurrency(value) {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return formatter.format(safeNumber(value));
}

export function formatQuantity(item) {
  const quantity = trimTrailingZeroes(safeNumber(item.quantity));
  return quantity + ' ' + item.unit;
}

export function formatPeople(count) {
  const people = Math.max(1, Math.round(safeNumber(count)));
  return people + ' ' + (people === 1 ? 'person' : 'people');
}

export function friendlyList(items) {
  const names = items.map((item) => item.name).filter(Boolean);
  if (names.length <= 2) return names.join(' and ');
  return names.slice(0, -1).join(', ') + ', and ' + names.at(-1);
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function trimTrailingZeroes(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}
