import { formatQuantity } from '../lib/formatting.js';

const React = window.React;

export default function PantryChecklist({ items, onToggleOwned }) {
  const ownedCount = countOwnedItems(items);
  return (
    <article className="panel pantry-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-label">Pantry check</span>
          <h2>Already at home</h2>
        </div>
        <span className="status-pill">{ownedCount} checked</span>
      </div>
      <div className="checklist">
        {items.map((item) => (
          <label key={item.id} className="check-row">
            <input
              type="checkbox"
              checked={Boolean(item.owned)}
              onChange={() => onToggleOwned(item.id)}
            />
            <span>
              <b>{item.name}</b>
              <small>{formatQuantity(item)} - {item.category}</small>
            </span>
          </label>
        ))}
      </div>
    </article>
  );
}

function countOwnedItems(items) {
  return items.filter((item) => item.owned).length;
}
