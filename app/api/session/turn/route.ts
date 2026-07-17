import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { createLiveTurn } from "@/lib/server/live-provider";
import { getOpenAIClient } from "@/lib/server/openai-client";
import { allowRequest, requestKey } from "@/lib/server/rate-limit";
import { readBoundedJson } from "@/lib/server/bounded-json";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (getServerEnv().providerMode !== "live") {
      return NextResponse.json(
        { ok: false, code: "PROVIDER_ERROR", message: "Live mode is not enabled." },
        { status: 503 },
      );
    }
    if (!allowRequest(`turn:${requestKey(request)}`)) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED", message: "Too many teaching turns. Please wait a minute." },
        { status: 429 },
      );
    }
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > 32 * 1024) {
      return NextResponse.json(
        { ok: false, code: "INVALID_INPUT", message: "The teaching turn is too large." },
        { status: 413 },
      );
    }
    const result = await createLiveTurn(
      await readBoundedJson(request, 32 * 1024),
      getOpenAIClient(),
    );
    const status = result.ok
      ? 200
      : result.code === "INVALID_INPUT"
        ? 400
        : result.code === "RATE_LIMITED"
          ? 429
          : 502;
    return NextResponse.json(result, { status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "INVALID_INPUT",
        message:
          error instanceof RangeError
            ? "The teaching turn is too large."
            : "The request could not be read.",
      },
      { status: error instanceof RangeError ? 413 : 400 },
    );
  }
}
