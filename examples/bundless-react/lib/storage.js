const storageKey = 'ironglancer-pantry-plan';

export function readSavedPlan() {
  if (!canUseStorage()) return null;
  return parseSavedPlan(window.localStorage.getItem(storageKey));
}

export function writeSavedPlan(plan) {
  if (!canUseStorage()) return false;
  window.localStorage.setItem(storageKey, JSON.stringify(storageSnapshot(plan)));
  return true;
}

function canUseStorage() {
  return typeof window === 'object' && Boolean(window.localStorage);
}

function parseSavedPlan(raw) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function storageSnapshot(plan) {
  return {
    householdSize: plan.householdSize,
    budget: plan.budget,
    focus: plan.focus,
    ownedItemIds: plan.ownedItemIds,
    updatedAt: plan.updatedAt,
  };
}
