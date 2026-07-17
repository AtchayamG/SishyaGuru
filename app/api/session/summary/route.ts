import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createLiveSummary } from "@/lib/server/live-provider";
import { getOpenAIClient } from "@/lib/server/openai-client";
import { allowRequest, requestKey } from "@/lib/server/rate-limit";
import { readBoundedJson } from "@/lib/server/bounded-json";

export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_SUMMARY_BODY_BYTES = 64 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_SUMMARY_BODY_BYTES) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: "The summary request is too large." },
        { status: 413 },
      );
    }
    if (getServerEnv().providerMode !== "live") {
      return NextResponse.json(
        { ok: false, code: "PROVIDER_ERROR", message: "Live mode is not enabled." },
        { status: 503 },
      );
    }
    if (!allowRequest(`summary:${requestKey(request)}`)) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED", message: "Too many summary requests. Please wait a minute." },
        { status: 429 },
      );
    }
    const result = await createLiveSummary(
      await readBoundedJson(request, MAX_SUMMARY_BODY_BYTES),
      getOpenAIClient(),
    );
    return NextResponse.json(result, {
      status: result.ok
        ? 200
        : result.code === "INVALID_INPUT"
          ? 400
          : result.code === "RATE_LIMITED"
            ? 429
            : 502,
    });
  } catch (error) {
    if (error instanceof RangeError) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: "The summary request is too large." },
        { status: 413 },
      );
    }
    return NextResponse.json(
      { ok: false, code: "INVALID_INPUT", message: "The request could not be read." },
      { status: 400 },
    );
  }
}
