const React = window.React;
const ReactDOM = window.ReactDOM;

const App = await window.import('./App.jsx').then((module) => module.default);

ReactDOM.render(<App />, document.getElementById('react-root'));
