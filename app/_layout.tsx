// app/_layout.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "./global.css";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('Current route segments:', segments);
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("userToken");
      // If not logged in and not already on /auth/*
      if (!token && (segments[0] as string) !== "auth") {
        router.replace("/auth/login");
      }
    };
    checkAuth();
  }, [router, segments]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="timer/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="new/create" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}
