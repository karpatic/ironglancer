export const focusOptions = [
  { id: 'balanced', label: 'Balanced week' },
  { id: 'quick', label: 'Quick dinners' },
  { id: 'vegetable', label: 'More vegetables' },
];

export const pantryItems = [
  { id: 'rice', name: 'Brown rice', category: 'Grains', quantity: 1, unit: 'bag', unitPrice: 4.8, importance: 8 },
  { id: 'beans', name: 'Black beans', category: 'Pantry', quantity: 4, unit: 'cans', unitPrice: 1.45, importance: 7 },
  { id: 'eggs', name: 'Eggs', category: 'Dairy', quantity: 1, unit: 'dozen', unitPrice: 4.2, importance: 6 },
  { id: 'greens', name: 'Salad greens', category: 'Produce', quantity: 2, unit: 'boxes', unitPrice: 3.9, importance: 9 },
  { id: 'tomatoes', name: 'Tomatoes', category: 'Produce', quantity: 6, unit: 'each', unitPrice: 0.9, importance: 6 },
  { id: 'chicken', name: 'Chicken thighs', category: 'Protein', quantity: 2, unit: 'lb', unitPrice: 5.4, importance: 8 },
  { id: 'tofu', name: 'Tofu', category: 'Protein', quantity: 2, unit: 'packs', unitPrice: 2.6, importance: 7 },
  { id: 'oats', name: 'Rolled oats', category: 'Breakfast', quantity: 1, unit: 'tub', unitPrice: 4.6, importance: 5 },
  { id: 'yogurt', name: 'Greek yogurt', category: 'Dairy', quantity: 2, unit: 'tubs', unitPrice: 4.3, importance: 5 },
  { id: 'bananas', name: 'Bananas', category: 'Produce', quantity: 8, unit: 'each', unitPrice: 0.32, importance: 5 },
  { id: 'broth', name: 'Vegetable broth', category: 'Pantry', quantity: 2, unit: 'cartons', unitPrice: 2.4, importance: 4 },
  { id: 'pasta', name: 'Pasta', category: 'Grains', quantity: 2, unit: 'boxes', unitPrice: 1.9, importance: 6 },
];

const menuByFocus = {
  balanced: ['Rice bowls', 'Sheet-pan chicken', 'Pasta night', 'Big salad lunch'],
  quick: ['Egg bowls', 'Pasta night', 'Tofu stir fry', 'Overnight oats'],
  vegetable: ['Big salad lunch', 'Tofu stir fry', 'Tomato bean soup', 'Rice bowls'],
};

export function createStarterPlan() {
  return {
    householdSize: 3,
    budget: 95,
    focus: 'balanced',
    ownedItemIds: ['rice', 'beans', 'eggs'],
    updatedAt: new Date().toISOString(),
  };
}

export function mealTemplatesForFocus(focus) {
  return menuByFocus[focus] || menuByFocus.balanced;
}

export function readableFocusName(focus) {
  const match = focusOptions.find((option) => option.id === focus);
  return match ? match.label : 'Balanced week';
}
