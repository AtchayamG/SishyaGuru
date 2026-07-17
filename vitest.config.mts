import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/foundation/**/*.test.ts", "tests/domain/**/*.test.ts"],
    environment: "node",
  },
});
