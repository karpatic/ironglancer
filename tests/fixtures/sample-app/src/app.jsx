import App from './components/App.jsx';
import { helper } from '@lib/util';
import '/shared/theme.js';
const pane = await window.import('./panes/Inspector.jsx');
const remoteLib = await import('https://cdn.example.com/widget.js');

export default function RootApp() {
  return App({ helper, pane, remoteLib });
}
