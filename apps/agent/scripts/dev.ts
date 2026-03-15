import Renderer from "../src/index.html";

const server = Bun.serve({
  port: 3000,
  routes: {
    "/": Renderer,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log(`Listening on ${server.url}`);
