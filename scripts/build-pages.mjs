// Builds the static Replay-only GitHub Pages export into out/ and verifies it.
// Sources are never modified: the export is selected purely via GITHUB_PAGES=true
// (see next.config.ts and app/page.tsx).
import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

execSync("next build", {
  stdio: "inherit",
  env: { ...process.env, GITHUB_PAGES: "true" },
});

function fail(problem) {
  console.error(`build:pages verification failed: ${problem}`);
  process.exit(1);
}

const html = readFileSync("out/index.html", "utf8");
if (!html.includes("/SishyaGuru/_next/")) {
  fail("assets are not prefixed with the /SishyaGuru base path");
}
// The provider label renders after hydration, so assert the serialized page
// props pin Replay mode (the string is backslash-escaped inside flight data)
// and that the UI ships the Replay label in its JS.
if (!/providerMode\\?":\\?"replay\\?"/.test(html)) {
  fail("exported page props do not pin providerMode to replay");
}
const chunkDir = join("out", "_next", "static", "chunks");
const hasReplayLabel = readdirSync(chunkDir, { recursive: true })
  .filter((name) => String(name).endsWith(".js"))
  .some((name) => readFileSync(join(chunkDir, String(name)), "utf8").includes("Simulated (Replay mode)"));
if (!hasReplayLabel) {
  fail("exported bundle does not contain the Simulated (Replay mode) label");
}
console.log("build:pages OK: out/ is Replay-only and /SishyaGuru-prefixed");
