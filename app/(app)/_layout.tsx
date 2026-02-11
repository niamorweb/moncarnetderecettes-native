import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { Colors } from "@/constants/theme";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.neutral[100],
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === "ios" ? 85 : 60,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.rose[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarLabelStyle: {
          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Recettes",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "grid" : "grid-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pdf-viewer"
        options={{
          title: "Carnet",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Paramètres",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "options" : "options-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      {/* Hidden routes */}
      <Tabs.Screen name="new-recipe" options={{ href: null }} />
      <Tabs.Screen name="scan-recipe" options={{ href: null }} />
      <Tabs.Screen name="recipe/[id]" options={{ href: null }} />
      <Tabs.Screen name="recipe/edit/[id]" options={{ href: null }} />
    </Tabs>
  );
}
