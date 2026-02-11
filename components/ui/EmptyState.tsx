import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSizes, FontWeights, Spacing } from "@/constants/theme";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({
  icon = "cube-outline",
  title,
  description,
  children,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={48} color={Colors.neutral[300]} />
      </View>

      <Text style={styles.title}>{title}</Text>

      {description && <Text style={styles.description}>{description}</Text>}

      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["4xl"],
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.black,
    color: Colors.neutral[800],
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSizes.base,
    color: Colors.neutral[500],
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 22,
  },
  actions: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
});
