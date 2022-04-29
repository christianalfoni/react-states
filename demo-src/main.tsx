import * as React from 'react';
import { render, createPortal } from 'react-dom';
import { DevtoolsManager, DevtoolsProvider } from '../src/devtools';
import { App } from './App';

const rootElement = document.getElementById('root');

render(
  <DevtoolsProvider>
    <App />
  </DevtoolsProvider>,
  rootElement,
);
