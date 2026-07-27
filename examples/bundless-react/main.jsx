import React from 'react';
import ReactDOM from 'react-dom';

const App = await window.import('./App.jsx').then((module) => module.default);

ReactDOM.render(<App />, document.getElementById('react-root'));
