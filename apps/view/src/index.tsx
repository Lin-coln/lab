import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./index.css";

import { RootLayout } from "@/layouts/RootLayout";
import { ErrorBoundary } from "@/layouts/ErrorBoundary";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    ErrorBoundary,
    children: [
      { index: true, lazy: () => import("./routes/home") },
      { path: "bar/:name", lazy: () => import("./routes/bar") },
    ],
  },
]);

const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

const elem = document.getElementById("root")!;
if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
