const React = window.React;

const features = [
  'JSX transpiled in the browser by Bundless',
  'No application bundle or framework build step',
  'Module graph generated from the authored React source',
];

export default function FeatureList() {
  return (
    <article className="demo-card feature-card">
      <span className="card-label">What this proves</span>
      <ul>
        {features.map((feature) => <li key={feature}>{feature}</li>)}
      </ul>
    </article>
  );
}
