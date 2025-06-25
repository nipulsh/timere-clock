// app/_layout.tsx
import { Stack } from "expo-router";
import "./global.css";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="timer/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="new/create" options={{ headerShown: false }} />
    </Stack>
  );
}
