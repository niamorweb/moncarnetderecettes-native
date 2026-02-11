import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, BorderRadius, FontSizes, Spacing, Shadows } from "@/constants/theme";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

const iconMap: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  error: "alert-circle",
  info: "information-circle",
};

const colorMap: Record<ToastType, { bg: string; icon: string; text: string }> = {
  success: {
    bg: Colors.success.light,
    icon: Colors.success.main,
    text: Colors.success.dark,
  },
  error: {
    bg: Colors.error.light,
    icon: Colors.error.main,
    text: Colors.error.dark,
  },
  info: {
    bg: Colors.info.light,
    icon: Colors.info.main,
    text: Colors.info.dark,
  },
};

export function Toast({
  message,
  type,
  visible,
  onHide,
  duration = 4000,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const colors = colorMap[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + Spacing.md },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: colors.bg }]}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <Ionicons name={iconMap[type]} size={20} color={colors.icon} />
        <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
        <Ionicons name="close" size={18} color={colors.text} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 999,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  message: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: "600",
  },
});
