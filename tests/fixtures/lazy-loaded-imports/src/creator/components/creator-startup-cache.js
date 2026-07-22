export function loadCreatorModuleOnce(specifier) {
  return window.import(specifier);
}
