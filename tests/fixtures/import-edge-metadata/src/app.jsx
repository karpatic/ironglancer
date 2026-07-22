import StaticDefault, { StaticNamed as StaticAlias, StaticSame } from './static-child.jsx';

const { DynamicExport: DynamicLocal } = await window.import('./dynamic-child.jsx');

const FACULTY_BODY_SPECIFIER = './faculty-body-child.jsx';
const FACULTY_EDITOR_SPECIFIER = './faculty-editor-child.jsx';
const UNUSED_SPECIFIER = './unused-child.jsx';

function useCreatorModule(specifier) {
  return { module: {}, specifier };
}

export function App() {
  const { module, loading, error } = useCreatorModule(FACULTY_BODY_SPECIFIER, true, 0);
  if (loading || error) return null;
  const CreatorViewBody = module?.CreatorViewBody;

  return (
    <>
      {StaticDefault}
      {StaticAlias}
      {StaticSame}
      {DynamicLocal}
      {CreatorViewBody}
      <CreatorLazyEditor specifier={FACULTY_EDITOR_SPECIFIER} exportName="CreatorQuizEntryEditor" />
    </>
  );
}
