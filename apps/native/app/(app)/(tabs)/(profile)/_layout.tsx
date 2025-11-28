import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: "none",
        }}
      />
      <Stack.Screen
        name="achievements"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="streak-calendar"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="certificates"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="invite"
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: "card",
        }}
      />
    </Stack>
  );
}
