import StaticDefault, { StaticNamed as StaticAlias, StaticSame } from './static-child.jsx';

const { DynamicExport: DynamicLocal } = await window.import('./dynamic-child.jsx');

function renderDynamicValue(value) {
  return value;
}

export function App() {
  const DynamicView = renderDynamicValue(DynamicLocal);

  return (
    <>
      {StaticDefault}
      {StaticAlias}
      {StaticSame}
      {DynamicView}
    </>
  );
}
