import * as React from "react";
import { createRoot } from "react-dom/client";
import { debugging } from "../src";

debugging.active = true;

import { App } from "./App";

const rootElement = document.getElementById("root");

const root = createRoot(rootElement!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
