import { Stack } from "expo-router";

export default function TutorChatLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="text-viewer"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
