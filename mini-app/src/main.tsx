import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";

// Import global styles
import "./index.css";
import "./standalone.css";
import "./enhancements.css";

const container = document.getElementById("app")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
