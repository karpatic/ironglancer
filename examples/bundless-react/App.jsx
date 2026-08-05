import { createStarterPlan, focusOptions, pantryItems, readableFocusName } from './data/seedPlan.js';
import { buildShoppingPlan } from './lib/recommendations.js';
import { readSavedPlan, writeSavedPlan } from './lib/storage.js';
import { copyPlanToClipboard } from './lib/share.js';

const React = window.React;

const { default: BudgetSummary } = await window.import('./components/BudgetSummary.jsx');
const { default: PantryChecklist } = await window.import('./components/PantryChecklist.jsx');
const { default: RecommendationPanel } = await window.import('./components/RecommendationPanel.jsx');
const { default: ShoppingList } = await window.import('./components/ShoppingList.jsx');

export default function App() {
  const [plan, setPlan] = React.useState(() => loadInitialPlan());
  const [copyStatus, setCopyStatus] = React.useState('');
  const shoppingPlan = React.useMemo(() => buildShoppingPlan(plan, pantryItems), [plan]);

  React.useEffect(() => {
    writeSavedPlan(plan);
  }, [plan]);

  function changeHouseholdSize(value) {
    setPlan((current) => updatePlanSetting(current, 'householdSize', value));
  }

  function changeBudget(value) {
    setPlan((current) => updatePlanSetting(current, 'budget', value));
  }

  function changeFocus(value) {
    setPlan((current) => updatePlanSetting(current, 'focus', value));
  }

  function toggleOwnedItem(itemId) {
    setPlan((current) => toggleOwnedItemInPlan(current, itemId));
  }

  async function copyShoppingList() {
    const result = await copyPlanToClipboard({ plan, shoppingPlan });
    setCopyStatus(result.message);
  }

  return (
    <main className="site-shell">
      <section className="planner-shell" aria-labelledby="planner-title">
        <div className="planner-header">
          <div>
            <p className="eyebrow">Kitchen desk</p>
            <h1 id="planner-title">Pantry Week Planner</h1>
            <p className="lede">
              Build a short shopping list from what is already on hand, the number of people eating,
              and a weekly grocery target.
            </p>
          </div>
          <PlanControls
            plan={plan}
            onHouseholdSizeChange={changeHouseholdSize}
            onBudgetChange={changeBudget}
            onFocusChange={changeFocus}
          />
        </div>

        <div className="planner-grid">
          <BudgetSummary plan={plan} shoppingPlan={shoppingPlan} />
          <RecommendationPanel
            focusLabel={readableFocusName(plan.focus)}
            menu={shoppingPlan.menu}
            recommendations={shoppingPlan.recommendations}
          />
          <PantryChecklist items={shoppingPlan.items} onToggleOwned={toggleOwnedItem} />
          <ShoppingList
            neededItems={shoppingPlan.neededItems}
            categoryTotals={shoppingPlan.categoryTotals}
            onCopyList={copyShoppingList}
            copyStatus={copyStatus}
          />
        </div>
      </section>

      <section className="analysis-section" aria-labelledby="analysis-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">IronGlancer</p>
            <h2 id="analysis-title">Function map for this planner</h2>
          </div>
          <a href="./analysis/" target="_blank" rel="noreferrer">Open full viewer</a>
        </div>
        <iframe
          className="analysis-frame"
          src="./analysis/"
          title="IronGlancer analysis of the pantry planner source"
        />
      </section>
    </main>
  );
}

function PlanControls({ plan, onHouseholdSizeChange, onBudgetChange, onFocusChange }) {
  return (
    <form className="plan-controls" aria-label="Plan settings">
      <NumberField
        id="household-size"
        label="People"
        min="1"
        max="8"
        value={plan.householdSize}
        onChange={onHouseholdSizeChange}
      />
      <NumberField
        id="weekly-budget"
        label="Budget"
        min="30"
        max="220"
        value={plan.budget}
        prefix="$"
        onChange={onBudgetChange}
      />
      <label className="field">
        <span>Focus</span>
        <select value={plan.focus} onChange={(event) => onFocusChange(event.target.value)}>
          {focusOptions.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </label>
    </form>
  );
}

function NumberField({ id, label, min, max, value, prefix = '', onChange }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <div className="number-input">
        {prefix && <b>{prefix}</b>}
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => onChange(readNumberSetting(event.target.value, value))}
        />
      </div>
    </label>
  );
}

function loadInitialPlan() {
  return mergeSavedPlan(createStarterPlan(), readSavedPlan());
}

function mergeSavedPlan(starter, saved) {
  if (!saved) return starter;
  return {
    ...starter,
    ...saved,
    ownedItemIds: Array.isArray(saved.ownedItemIds) ? saved.ownedItemIds : starter.ownedItemIds,
  };
}

function updatePlanSetting(plan, key, value) {
  return {
    ...plan,
    [key]: value,
    updatedAt: new Date().toISOString(),
  };
}

function toggleOwnedItemInPlan(plan, itemId) {
  const ownedItemIds = new Set(plan.ownedItemIds || []);
  if (ownedItemIds.has(itemId)) {
    ownedItemIds.delete(itemId);
  } else {
    ownedItemIds.add(itemId);
  }
  return updatePlanSetting(plan, 'ownedItemIds', Array.from(ownedItemIds));
}

function readNumberSetting(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
