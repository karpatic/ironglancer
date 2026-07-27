import React from 'react';

const Counter = await window.import('./Counter.jsx').then((module) => module.default);
const FeatureList = await window.import('./FeatureList.jsx').then((module) => module.default);

export default function App() {
  return (
    <main className="site-shell">
      <section className="hero">
        <p className="eyebrow">Bundless × IronGlancer</p>
        <h1>A React app with nothing to bundle</h1>
        <p className="lede">
          This page runs its authored JSX directly in the browser with Bundless. The
          diagram below is IronGlancer analyzing these exact source files.
        </p>
        <div className="demo-grid">
          <Counter />
          <FeatureList />
        </div>
      </section>

      <section className="analysis-section" aria-labelledby="analysis-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Self-analysis</p>
            <h2 id="analysis-title">See how this app is connected</h2>
          </div>
          <a href="./analysis/" target="_blank" rel="noreferrer">
            Open full viewer
          </a>
        </div>
        <iframe
          className="analysis-frame"
          src="./analysis/"
          title="IronGlancer analysis of this Bundless React app"
        />
      </section>
    </main>
  );
}
