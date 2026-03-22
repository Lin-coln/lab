import Index from "../src/index.html";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/*": Index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Listening on ${server.url}`);
