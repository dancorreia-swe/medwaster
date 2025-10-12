import { Redirect, Stack } from "expo-router";
import { authClient } from "@/lib/auth-client";

export default function AppLayout() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return null;
  }

  if (!session) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="tutor" options={{ headerShown: false }} />
    </Stack>
  );
}
