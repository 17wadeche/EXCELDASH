// src/taskpane/index.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { DashboardProvider } from "./context/DashboardContext";
import App from "./components/App";
import "./taskpane.css";

declare const Office: any;

Office.onReady(() => {
  const container = document.getElementById("container");
  if (!container) {
    throw new Error("Failed to find the root element.");
  }
  const root = ReactDOM.createRoot(container);
  root.render(
    <MemoryRouter>
      <DashboardProvider>
        <App />
      </DashboardProvider>
    </MemoryRouter>
  );
});
