import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { inspectAudio } from "../../lib/server/audio-provider";
import { deriveWebmDurationMs } from "../../lib/server/webm-duration";

function id(value: number) {
  const result: number[] = [];
  for (let shift = 24; shift >= 0; shift -= 8) {
    const byte = (value >>> shift) & 0xff;
    if (byte || result.length) result.push(byte);
  }
  return result;
}

function size(value: number) {
  for (let length = 1; length <= 4; length += 1) {
    if (value < 2 ** (length * 7) - 1) {
      const result = Array<number>(length).fill(0);
      for (let index = length - 1; index >= 0; index -= 1) {
        result[index] = value & 0xff;
        value >>>= 8;
      }
      result[0]! |= 1 << (8 - length);
      return result;
    }
  }
  throw new Error("test element too large");
}

function element(elementId: number, payload: number[]) {
  return [...id(elementId), ...size(payload.length), ...payload];
}

function uint(value: number) {
  const result: number[] = [];
  do {
    result.unshift(value & 0xff);
    value >>>= 8;
  } while (value);
  return result;
}

function webm({
  timestamp = 0,
  packet = [0xfb, 0x83],
  flags = 0x80,
  codec = "A_OPUS",
  unknownSizes = false,
} = {}) {
  const header = element(0x1a45dfa3, element(0x4282, [...Buffer.from("webm")]));
  const info = element(0x1549a966, element(0x2ad7b1, uint(1_000_000)));
  const entry = element(0xae, [
    ...element(0xd7, [1]),
    ...element(0x83, [2]),
    ...element(0x86, [...Buffer.from(codec)]),
  ]);
  const tracks = element(0x1654ae6b, entry);
  const block = element(0xa3, [0x81, 0, 0, flags, ...packet]);
  const clusterPayload = [...element(0xe7, uint(timestamp)), ...block];
  const cluster = unknownSizes
    ? [...id(0x1f43b675), 0xff, ...clusterPayload]
    : element(0x1f43b675, clusterPayload);
  const payload = [...info, ...tracks, ...cluster];
  const segment = unknownSizes
    ? [...id(0x18538067), 0xff, ...payload]
    : element(0x18538067, payload);
  return Uint8Array.from([...header, ...segment]);
}

describe("WebM Opus duration", () => {
  it("accepts the captured Chrome MediaRecorder file without a Duration element", async () => {
    const fixture = readFileSync(resolve("tests/fixtures/live-browser-recording.webm"));
    expect(deriveWebmDurationMs(fixture)).toBe(8_940);
    expect(await inspectAudio(fixture)).toMatchObject({
      mediaType: "audio/webm",
      durationMs: 8_940,
      durationSource: "server-derived",
    });
  });

  it("accepts Chrome-style unknown-sized Segment and Cluster", () => {
    expect(deriveWebmDurationMs(webm({ unknownSizes: true }))).toBe(60);
  });

  it("enforces the exact 60 second boundary using the final Opus packet", () => {
    expect(deriveWebmDurationMs(webm({ timestamp: 59_940 }))).toBe(60_000);
    expect(deriveWebmDurationMs(webm({ timestamp: 59_941 }))).toBeUndefined();
  });

  it("uses normative Opus TOC frame durations", () => {
    expect(deriveWebmDurationMs(webm({ packet: [0x00] }))).toBe(10);
    expect(deriveWebmDurationMs(webm({ packet: [0x18] }))).toBe(60);
    expect(deriveWebmDurationMs(webm({ packet: [0x80] }))).toBe(3);
    expect(deriveWebmDurationMs(webm({ packet: [0x83, 0x30] }))).toBe(120);
  });

  it("rejects malformed or overlong Opus declarations", () => {
    expect(deriveWebmDurationMs(webm({ packet: [0x03] }))).toBeUndefined();
    expect(deriveWebmDurationMs(webm({ packet: [0x03, 0] }))).toBeUndefined();
    expect(deriveWebmDurationMs(webm({ packet: [0x1b, 3] }))).toBeUndefined();
  });

  it("rejects unsupported codecs and lacing", () => {
    expect(deriveWebmDurationMs(webm({ codec: "A_VORBIS" }))).toBeUndefined();
    expect(deriveWebmDurationMs(webm({ flags: 0x82 }))).toBeUndefined();
  });

  it("does not interpret EBML identifiers embedded in packet data", () => {
    expect(deriveWebmDurationMs(webm({ packet: [0, 0x1f, 0x43, 0xb6, 0x75] }))).toBe(10);
  });

  it("rejects truncation and invalid document type without throwing", () => {
    const valid = webm();
    expect(deriveWebmDurationMs(valid.subarray(0, valid.length - 1))).toBeUndefined();
    const wrong = valid.slice();
    wrong[Buffer.from(wrong).indexOf(Buffer.from("webm"))] = 0x6d;
    expect(deriveWebmDurationMs(wrong)).toBeUndefined();
  });
});
