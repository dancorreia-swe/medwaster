import { Stack } from "expo-router";
import {
  DarkTheme,
  DefaultTheme,
  type Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { NAV_THEME } from "@/lib/constants";
import React, { useRef, useState } from "react";
import { useColorScheme } from "@/lib/use-color-scheme";
import { Platform } from "react-native";
import { setAndroidNavigationBar } from "@/lib/android-navigation-bar";
import { SessionProvider } from "@/lib/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export const unstable_settings = {
  // Logged-out users should land on auth first to avoid mounted app tabs firing requests
  initialRouteName: "(auth)",
};

export default function RootLayout() {
  const hasMounted = useRef(false);
  const { colorScheme, isDarkColorScheme } = useColorScheme();
  const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
  const [queryClient] = useState(() => new QueryClient());

  useIsomorphicLayoutEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web") {
      document.documentElement.classList.add("bg-background");
    }
    setAndroidNavigationBar(colorScheme);
    setIsColorSchemeLoaded(true);
    hasMounted.current = true;
  }, []);

  if (!isColorSchemeLoaded) {
    return null;
  }
  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
        <StatusBar style={isDarkColorScheme ? "light" : "dark"} />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <QueryClientProvider client={queryClient}>
            <SessionProvider>
              <BottomSheetModalProvider>
                <Stack>
                  <Stack.Screen name="(app)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="modal"
                    options={{ title: "Modal", presentation: "modal" }}
                  />
                </Stack>
              </BottomSheetModalProvider>
            </SessionProvider>
            <Toaster
              position="top-center"
              richColors
              closeButton
              swipeToDismissDirection="up"
            />
          </QueryClientProvider>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const useIsomorphicLayoutEffect =
  Platform.OS === "web" && typeof window === "undefined"
    ? React.useEffect
    : React.useLayoutEffect;
