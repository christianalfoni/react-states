import * as React from 'react';
import { render } from 'react-dom';
import { DevtoolsProvider } from '../src/devtools';
import { App } from './App';

const rootElement = document.getElementById('root');

render(
  <DevtoolsProvider>
    <App />
  </DevtoolsProvider>,
  rootElement,
);
