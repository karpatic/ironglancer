import { formatCurrency, formatQuantity } from '../lib/formatting.js';

const React = window.React;

export default function ShoppingList({ neededItems, categoryTotals, onCopyList, copyStatus }) {
  return (
    <article className="panel shopping-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-label">Shopping list</span>
          <h2>{neededItems.length} items to buy</h2>
        </div>
        <button type="button" onClick={onCopyList}>Copy list</button>
      </div>
      {copyStatus && <p className="copy-status">{copyStatus}</p>}
      <div className="shopping-layout">
        <ul className="shopping-list">
          {neededItems.map((item) => (
            <li key={item.id}>
              <span>
                <b>{item.name}</b>
                <small>{formatQuantity(item)}</small>
              </span>
              <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
            </li>
          ))}
        </ul>
        <CategoryBreakdown categoryTotals={categoryTotals} />
      </div>
    </article>
  );
}

function CategoryBreakdown({ categoryTotals }) {
  const categories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  return (
    <aside className="category-breakdown">
      {categories.map(([category, total]) => (
        <div key={category}>
          <span>{category}</span>
          <b>{formatCurrency(total)}</b>
        </div>
      ))}
    </aside>
  );
}
