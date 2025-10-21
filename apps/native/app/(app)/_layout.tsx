import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="article" />
      <Stack.Screen name="tutor-chat" />
      <Stack.Screen name="dev-home" />
    </Stack>
  );
}
