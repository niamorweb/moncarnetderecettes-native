import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadows,
} from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateActionSheet({ visible, onClose }: CreateActionSheetProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleManualCreate = () => {
    onClose();
    setTimeout(() => {
      router.push("/(app)/new-recipe");
    }, 100);
  };

  const handleScan = () => {
    onClose();
    setTimeout(() => {
      router.push("/(app)/scan-recipe");
    }, 100);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Nouvelle recette</Text>
        <Text style={styles.subtitle}>
          Comment souhaitez-vous ajouter votre recette ?
        </Text>

        {/* Options */}
        <View style={styles.options}>
          {/* Manual Create */}
          <TouchableOpacity
            style={styles.option}
            onPress={handleManualCreate}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, styles.optionIconManual]}>
              <Ionicons name="create-outline" size={28} color={Colors.rose[600]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Saisir manuellement</Text>
              <Text style={styles.optionDescription}>
                Remplissez le formulaire avec les ingrédients et étapes
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.neutral[400]}
            />
          </TouchableOpacity>

          {/* Scan */}
          <TouchableOpacity
            style={styles.option}
            onPress={handleScan}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, styles.optionIconScan]}>
              <Ionicons name="scan-outline" size={28} color={Colors.info.main} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Scanner une recette</Text>
              <Text style={styles.optionDescription}>
                Photographiez une recette papier ou un livre
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.neutral[400]}
            />
          </TouchableOpacity>
        </View>

        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    paddingBottom: Spacing["4xl"],
    ...Shadows.xl,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.neutral[300],
    borderRadius: BorderRadius.full,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    textAlign: "center",
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  options: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconManual: {
    backgroundColor: Colors.rose[100],
  },
  optionIconScan: {
    backgroundColor: Colors.info.light,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    lineHeight: 18,
  },
  cancelButton: {
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  cancelText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[500],
  },
});
