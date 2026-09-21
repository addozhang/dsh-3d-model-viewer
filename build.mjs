import { build } from "esbuild";

await build({
  entryPoints: ["src/entry-client.js"],
  bundle: true,
  format: "iife",
  outfile: "lib/client.js",
  target: "es2022",
  minify: false,
  legalComments: "none",
  banner: { js: "// generated from src/ — run `npm run build` after editing" },
  logLevel: "info",
});
console.log("lib/client.js built");
