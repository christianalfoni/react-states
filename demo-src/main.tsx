import * as React from 'react';
import { render, createPortal } from 'react-dom';
import { DevtoolsManager, DevtoolsProvider } from '../src/devtools';
import { App } from './App';
import { AuthFeature } from './AuthFeature';

const rootElement = document.getElementById('root');

render(
  <DevtoolsProvider>
    <DevtoolsManager />
    <AuthFeature>
      <App />
    </AuthFeature>
  </DevtoolsProvider>,
  rootElement,
);
