const PROVIDER_MODES = ["live", "replay"] as const;

export type ProviderMode = (typeof PROVIDER_MODES)[number];

export interface ServerEnv {
  providerMode: ProviderMode;
}

/**
 * Parses server configuration. Server-only: never returns the OpenAI key and
 * throws if evaluated in a browser context. Replay is the default so build
 * and judging need no credential.
 */
export function getServerEnv(
  env: Record<string, string | undefined> = process.env,
): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv is server-only and must not run in the browser");
  }
  const raw = env.SISHYAGURU_PROVIDER || "replay";
  if (!(PROVIDER_MODES as readonly string[]).includes(raw)) {
    throw new Error(
      `SISHYAGURU_PROVIDER must be "live" or "replay", got "${raw}"`,
    );
  }
  const providerMode = raw as ProviderMode;
  if (providerMode === "live" && !env.OPENAI_API_KEY) {
    throw new Error("SISHYAGURU_PROVIDER=live requires OPENAI_API_KEY to be set");
  }
  return { providerMode };
}
