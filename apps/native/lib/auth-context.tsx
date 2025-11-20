import { authClient } from "@/lib/auth-client";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, type PropsWithChildren } from "react";

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inAppGroup = segments[0] === "(app)";

    if (!session && inAppGroup) {
      router.replace("/(auth)/home");
    } else if (session && inAuthGroup) {
      router.replace("/(app)/(tabs)");
    }
  }, [session, segments, isPending, router]);

  const inAuthGroup = segments[0] === "(auth)";
  const inAppGroup = segments[0] === "(app)";

  return {
    shouldRenderChildren:
      !isPending &&
      // Don't render protected screens while redirecting away
      !(!session && inAppGroup) &&
      // Don't render auth screens while redirecting into the app
      !(session && inAuthGroup),
  };
}

export function SessionProvider({ children }: PropsWithChildren) {
  const { shouldRenderChildren } = useProtectedRoute();

  if (!shouldRenderChildren) {
    // Avoid mounting screens while session status is unresolved or redirecting
    return null;
  }

  return <>{children}</>;
}
