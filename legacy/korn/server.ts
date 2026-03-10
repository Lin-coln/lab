import Index from "./pages/index.html";
import { routes as apiRoutes } from "./api";

const server = Bun.serve({
  port: process.env.PORT,
  routes: {
    "/": Index,
    ...apiRoutes,
  },
  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`[server] 🚀 Server running at ${server.url}`);
