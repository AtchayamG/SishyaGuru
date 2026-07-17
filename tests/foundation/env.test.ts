import { describe, expect, it } from "vitest";
import { getServerEnv } from "../../lib/env";

describe("getServerEnv", () => {
  it("defaults to replay when SISHYAGURU_PROVIDER is unset", () => {
    expect(getServerEnv({})).toEqual({ providerMode: "replay" });
  });

  it("defaults to replay when SISHYAGURU_PROVIDER is empty", () => {
    expect(getServerEnv({ SISHYAGURU_PROVIDER: "" })).toEqual({
      providerMode: "replay",
    });
  });

  it("does not require OPENAI_API_KEY in replay mode", () => {
    expect(getServerEnv({ SISHYAGURU_PROVIDER: "replay" }).providerMode).toBe(
      "replay",
    );
  });

  it("rejects unknown provider values", () => {
    expect(() => getServerEnv({ SISHYAGURU_PROVIDER: "cloud" })).toThrow(
      /must be "live" or "replay"/,
    );
  });

  it("rejects live mode without a key (fail closed)", () => {
    expect(() => getServerEnv({ SISHYAGURU_PROVIDER: "live" })).toThrow(
      /requires OPENAI_API_KEY/,
    );
  });

  it("accepts live mode with a key but never returns the key", () => {
    const result = getServerEnv({
      SISHYAGURU_PROVIDER: "live",
      OPENAI_API_KEY: "test-key-not-real",
    });
    expect(result).toEqual({ providerMode: "live" });
    expect(JSON.stringify(result)).not.toContain("test-key-not-real");
  });
});
