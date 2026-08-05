import { formatCurrency } from '../lib/formatting.js';
import { summarizeMenu } from '../lib/recommendations.js';

const React = window.React;

export default function RecommendationPanel({ focusLabel, menu, recommendations }) {
  return (
    <article className="panel recommendation-panel">
      <span className="panel-label">{focusLabel}</span>
      <h2>{summarizeMenu(menu)}</h2>
      <ol className="recommendation-list">
        {recommendations.map((item) => (
          <li key={item.id}>
            <b>{item.name}</b>
            <span>{item.reason} - {formatCurrency(item.quantity * item.unitPrice)}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}
