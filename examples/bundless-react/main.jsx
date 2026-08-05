const React = window.React;
const ReactDOM = window.ReactDOM;

const { default: App } = await window.import('./App.jsx');

ReactDOM.render(<App />, document.getElementById('react-root'));
