import AppShell from "@/components/AppShell";
import { getServerEnv } from "@/lib/env";

export default function Page() {
  const { providerMode } = getServerEnv();
  return <AppShell providerMode={providerMode} />;
}
