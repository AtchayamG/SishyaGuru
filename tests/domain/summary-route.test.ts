import { describe, expect, it } from "vitest";
import { readBoundedJson } from "../../lib/server/bounded-json";

describe("summary request boundary", () => {
  it("parses a bounded JSON body", async () => {
    const request = new Request("http://localhost/api/session/summary", {
      method: "POST",
      body: JSON.stringify({ topicId: "water-cycle" }),
    });

    await expect(readBoundedJson(request, 64 * 1024)).resolves.toEqual({ topicId: "water-cycle" });
  });

  it("rejects a streamed oversized body without trusting Content-Length", async () => {
    const request = new Request("http://localhost/api/session/summary", {
      method: "POST",
      body: JSON.stringify({ evidence: "x".repeat(65 * 1024) }),
    });

    await expect(readBoundedJson(request, 64 * 1024)).rejects.toBeInstanceOf(RangeError);
  });
});
