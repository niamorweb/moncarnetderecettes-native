import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "outlined";
}

export function Card({ children, style, variant = "default" }: CardProps) {
  return (
    <View style={[styles.card, variant === "outlined" && styles.outlined, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.lg,
    ...Shadows.md,
  },
  outlined: {
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
});
