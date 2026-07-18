import AppShell from "@/components/AppShell";
import { getServerEnv } from "@/lib/env";

// Provider mode is a server deployment setting and must not be frozen at build time.
export const dynamic = "force-dynamic";

export default function Page() {
  const { providerMode } = getServerEnv();
  return <AppShell providerMode={providerMode} />;
}
