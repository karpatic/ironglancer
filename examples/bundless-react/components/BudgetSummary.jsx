import { formatCurrency, formatPeople } from '../lib/formatting.js';
import { describeBudget } from '../lib/pricing.js';

const React = window.React;

export default function BudgetSummary({ plan, shoppingPlan }) {
  const status = budgetStatus(shoppingPlan.total, plan.budget);
  return (
    <article className="panel summary-panel">
      <span className="panel-label">Weekly target</span>
      <div className="money-row">
        <strong>{formatCurrency(shoppingPlan.total)}</strong>
        <span className={status.className}>{describeBudget(shoppingPlan.total, plan.budget)}</span>
      </div>
      <dl className="summary-facts">
        <Fact label="People" value={formatPeople(plan.householdSize)} />
        <Fact label="Target" value={formatCurrency(plan.budget)} />
        <Fact label="Need to buy" value={String(shoppingPlan.neededItems.length)} />
      </dl>
    </article>
  );
}

function Fact({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function budgetStatus(total, budget) {
  if (total <= budget) return { className: 'status-pill is-good' };
  return { className: 'status-pill is-warn' };
}
