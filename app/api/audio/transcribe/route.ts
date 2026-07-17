import { NextResponse } from "next/server";
import { MAX_AUDIO_BYTES } from "@/lib/audio-policy";
import { getServerEnv } from "@/lib/env";
import { transcribeLiveAudio } from "@/lib/server/audio-provider";
import { getOpenAIClient } from "@/lib/server/openai-client";
import { allowRequest, requestKey } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    if (getServerEnv().providerMode !== "live") {
      return NextResponse.json(
        { ok: false, providerMode: "live", code: "TRANSCRIPTION_ERROR", message: "Live voice is not enabled." },
        { status: 503 },
      );
    }
    if (!allowRequest(`audio:${requestKey(request)}`)) {
      return NextResponse.json(
        { ok: false, providerMode: "live", code: "RATE_LIMITED", message: "Too many recordings. Please wait a minute." },
        { status: 429 },
      );
    }
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (contentLength > MAX_AUDIO_BYTES + 128 * 1024) {
      return NextResponse.json(
        { ok: false, providerMode: "live", code: "AUDIO_INVALID", message: "The recording is too large." },
        { status: 413 },
      );
    }
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof File)) {
      return NextResponse.json(
        { ok: false, providerMode: "live", code: "AUDIO_INVALID", message: "One audio recording is required." },
        { status: 400 },
      );
    }
    const result = await transcribeLiveAudio(audio, getOpenAIClient());
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch {
    return NextResponse.json(
      { ok: false, providerMode: "live", code: "AUDIO_INVALID", message: "The recording could not be read." },
      { status: 400 },
    );
  }
}
