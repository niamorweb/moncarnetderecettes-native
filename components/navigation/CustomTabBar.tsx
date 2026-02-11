import { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  Shadows,
} from "@/constants/theme";
import { CreateActionSheet } from "./CreateActionSheet";

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  {
    name: "index",
    label: "Carnet",
    icon: "book-outline",
    iconFocused: "book",
  },
  {
    name: "account",
    label: "Paramètres",
    icon: "settings-outline",
    iconFocused: "settings",
  },
  {
    name: "profile",
    label: "Profil",
    icon: "person-outline",
    iconFocused: "person",
  },
];

// Lookup map (O(1))
const TAB_MAP = Object.fromEntries(
  TABS.map((tab) => [tab.name, tab]),
) as Record<string, TabConfig>;

// Routes where tab bar is hidden
const HIDDEN_TAB_BAR_ROUTES = new Set([
  "recipe/[id]",
  "recipe/edit/[id]",
  "scan-recipe",
  "new-recipe",
]);

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const currentRouteName = state.routes[state.index]?.name;

  // Hide tab bar if needed
  if (HIDDEN_TAB_BAR_ROUTES.has(currentRouteName)) {
    return null;
  }

  const visibleRoutes = useMemo(
    () => state.routes.filter((r) => TAB_MAP[r.name]),
    [state.routes],
  );

  const renderTab = useCallback(
    (route: (typeof state.routes)[0]) => {
      const tab = TAB_MAP[route.name];
      if (!tab) return null;

      const isFocused = state.routes[state.index]?.name === route.name;

      const onPress = () => {
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name);
        }
      };

      return (
        <TouchableOpacity
          key={route.key}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={tab.label}
          onPress={onPress}
          style={styles.tab}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isFocused ? tab.iconFocused : tab.icon}
            size={24}
            color={isFocused ? Colors.rose[500] : Colors.neutral[400]}
          />
          <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [navigation, state.index, state.routes],
  );

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingBottom: insets.bottom || Spacing.md },
        ]}
      >
        {visibleRoutes.map(renderTab)}
      </View>

      <CreateActionSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    paddingTop: Spacing.sm,
    alignItems: "flex-end",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[400],
  },
  tabLabelFocused: {
    color: Colors.rose[500],
    fontWeight: FontWeights.bold,
  },
});
