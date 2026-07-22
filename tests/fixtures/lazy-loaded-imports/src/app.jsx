import React from 'react';

const {
  loadCreatorModuleOnce,
} = await window.import('/creator/components/creator-startup-cache.js');

const CREATOR_PANEL_SPECIFIER = '/creator/components/creator-panel.jsx';
const CREATOR_LAZY_WIDGET_SPECIFIER = '/creator/components/creator-lazy-widget.jsx';
const UNUSED_EDITOR_SPECIFIER = '/creator/components/unused-editor.jsx';

function useCreatorModule(specifier, shouldLoad = true) {
  if (!shouldLoad) return null;
  return loadCreatorModuleOnce(specifier);
}

function LazyEditorBoundary({ specifier }) {
  useCreatorModule(specifier);
  return <div>Preparing editor...</div>;
}

export function App({ showPanel = false }) {
  if (showPanel) {
    loadCreatorModuleOnce(CREATOR_PANEL_SPECIFIER);
  }

  return (
    <LazyEditorBoundary
      specifier={CREATOR_LAZY_WIDGET_SPECIFIER}
    />
  );
}
