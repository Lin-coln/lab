import Pages from "../src/index.html";

const server = Bun.serve({
  port: 3000,
  development: { hmr: true, console: true },
  routes: {
    "/*": Pages,
  },
});

console.log(`listening ${server.url.toString()}`);
