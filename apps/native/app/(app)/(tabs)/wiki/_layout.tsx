import { Stack } from "expo-router";

export default function WikiLayout() {
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
        name="[id]"
        options={{
          headerShown: false,
          href: null, // This hides it from tab bar
        }}
      />
    </Stack>
  );
}
