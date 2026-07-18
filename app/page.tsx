import { connection } from "next/server";
import AppShell from "@/components/AppShell";
import { getServerEnv } from "@/lib/env";

// Inlined at build time; set only by the GitHub Pages export (see next.config.ts).
const isReplayOnlyExport = process.env.NEXT_PUBLIC_REPLAY_ONLY === "1";

export default async function Page() {
  if (isReplayOnlyExport) {
    // Static Pages export: no server to consult, forcibly Replay-only.
    return <AppShell providerMode="replay" />;
  }
  // Provider mode is a server deployment setting and must not be frozen at
  // build time, so opt into request-time rendering.
  await connection();
  return <AppShell providerMode={getServerEnv().providerMode} />;
}
