import pkg from "../package.json";
import fs from "node:fs";

const github = {
  author: "lin-coln",
  url: "https://github.com/Lin-coln/lab.git",
};

// build
await Bun.$`bun run build`;

// publish
try {
  const hash = await Bun.$`git rev-parse --short HEAD`.text().then((x) => x.trim());

  const pkgPublish: Record<string, any> = structuredClone(pkg);
  delete (pkgPublish.scripts ?? {})["publish"];
  Object.assign(pkgPublish, {
    name: `@${github.author}/${pkg.name}`,
    author: github.author,
    version: `0.0.1-snapshot.${hash}`,
    repository: {
      type: "git",
      url: `git+${github.url}`,
    },
    publishConfig: {
      registry: "https://npm.pkg.github.com/",
      access: "public",
    },
  });

  await fs.promises.writeFile("package.json", JSON.stringify(pkgPublish, null, 2) + "\n");

  await Bun.$`bunx npm publish`;

  // pkg.version = version;
} finally {
  await fs.promises.writeFile("package.json", JSON.stringify(pkg, null, 2));
}
