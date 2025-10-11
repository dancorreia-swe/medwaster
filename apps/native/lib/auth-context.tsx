import { authClient } from "@/lib/auth-client";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, type PropsWithChildren } from "react";

// This hook will protect the route based on user authentication
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (!session && inAppGroup) {
      router.replace("/(auth)");
    } else if (session && inAuthGroup) {
      router.replace("/(app)");
    }
  }, [session, segments, isPending]);
}

export function SessionProvider({ children }: PropsWithChildren) {
  useProtectedRoute();
  return <>{children}</>;
}
