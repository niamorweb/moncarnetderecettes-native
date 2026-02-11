import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  Colors,
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "@/constants/theme";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? Colors.white : Colors.rose[500]}
          size="small"
        />
      ) : typeof children === "string" ? (
        <Text style={textStyles}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
  },

  // Variants
  primary: {
    backgroundColor: Colors.rose[500],
  },
  secondary: {
    backgroundColor: Colors.neutral[100],
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  destructive: {
    backgroundColor: Colors.error.main,
  },

  // Sizes
  size_sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
  },
  size_lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 52,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: "100%",
  },

  // Text styles
  text: {
    fontWeight: FontWeights.bold,
  },
  text_primary: {
    color: Colors.white,
  },
  text_secondary: {
    color: Colors.neutral[700],
  },
  text_outline: {
    color: Colors.neutral[700],
  },
  text_ghost: {
    color: Colors.neutral[600],
  },
  text_destructive: {
    color: Colors.error.main,
  },

  // Text sizes
  textSize_sm: {
    fontSize: FontSizes.sm,
  },
  textSize_md: {
    fontSize: FontSizes.base,
  },
  textSize_lg: {
    fontSize: FontSizes.md,
  },
});
