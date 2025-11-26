import { authClient } from "@/lib/auth-client";
import { useRouter, useSegments } from "expo-router";
import React, { useEffect, type PropsWithChildren } from "react";
import { View } from "react-native";

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
    isPending,
  };
}

export function SessionProvider({ children }: PropsWithChildren) {
  const { shouldRenderChildren, isPending } = useProtectedRoute();

  // Keep UI mounted during isPending (auth state checks) to prevent flashing
  // Only unmount when we're actually redirecting (shouldRenderChildren false AND not pending)
  if (!shouldRenderChildren && !isPending) {
    return <View className="flex-1 bg-background" />;
  }

  return <>{children}</>;
}
