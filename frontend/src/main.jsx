import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import AppContextProvider from "./context/AppContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  // The <BrowserRouter> provides routing capabilities to all of its children.
  // By wrapping <App /> here, every component inside App, including Navbar,
  // gets access to the routing context. This is the correct setup.
  <BrowserRouter>
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </BrowserRouter>
);
