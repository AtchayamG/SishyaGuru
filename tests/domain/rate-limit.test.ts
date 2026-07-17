import { beforeEach, describe, expect, it } from "vitest";
import {
  allowRequest,
  requestKey,
  resetRateLimitsForTests,
} from "../../lib/server/rate-limit";

describe("bounded in-process provider rate limit", () => {
  beforeEach(resetRateLimitsForTests);

  it("allows eight requests per key and rejects the ninth", () => {
    for (let count = 0; count < 8; count += 1) {
      expect(allowRequest("turn:test", 1000)).toBe(true);
    }
    expect(allowRequest("turn:test", 1000)).toBe(false);
    expect(allowRequest("turn:test", 61_001)).toBe(true);
  });

  it("uses the first trusted forwarded address without retaining request content", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(requestKey(request)).toBe("203.0.113.7");
  });
});
