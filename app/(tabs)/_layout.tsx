import { Ionicons } from "@expo/vector-icons"; // Use Expo-supported icons
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: "#0f0D23",
          borderRadius: 50,
          marginHorizontal: 20,
          marginBottom: 36,
          height: 52,
          position: "absolute",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#0f0D23",
        },
      }}
    >
      <Tabs.Screen
        name="index" // points to (tabs)/index.tsx
        options={{
          title: "timers",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="Stopwatch" // points to (tabs)/settings.tsx
        options={{
          title: "Stopwatch",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stopwatch" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
