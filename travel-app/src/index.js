import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

const apiBaseMeta = document.querySelector('meta[name="api-base"]');
if (apiBaseMeta && process.env.REACT_APP_API_URL) {
  apiBaseMeta.setAttribute("content", process.env.REACT_APP_API_URL);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
