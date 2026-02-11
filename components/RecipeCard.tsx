import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import type { Recipe } from "@/types";

const { width } = Dimensions.get("window");
// 2 colonnes avec padding latéral (24px) et espacement entre (16px)
const CARD_WIDTH = (width - 48 - 16) / 2;

interface RecipeCardProps {
  recipe: Recipe;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function RecipeCard({
  recipe,
  isSelected = false,
  isSelectionMode = false,
  onPress,
  onLongPress,
}: RecipeCardProps) {
  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {/* IMAGE WRAPPER */}
      <View style={[styles.imageContainer, isSelected && styles.imageSelected]}>
        {recipe.image_url ? (
          <Image
            source={{ uri: recipe.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="restaurant"
              size={32}
              color={Colors.rose[300]}
            />
          </View>
        )}

        {/* SELECTION OVERLAY */}
        {isSelectionMode && (
          <View style={styles.selectionOverlay}>
            <View
              style={[styles.checkbox, isSelected && styles.checkboxSelected]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
          </View>
        )}
      </View>

      {/* TEXT CONTENT */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recipe.name}
        </Text>

        {recipe.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{recipe.category.name}</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={Colors.rose[500]}
            />
            <Text style={styles.metaText}>{totalTime} min</Text>
          </View>
          {recipe.servings && (
            <View style={styles.metaItem}>
              <Ionicons
                name="people-outline"
                size={14}
                color={Colors.rose[500]}
              />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },

  // Image
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    backgroundColor: Colors.neutral[50],
  },
  imageSelected: {
    borderWidth: 2,
    borderColor: Colors.rose[500],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.rose[50],
  },

  // Selection
  selectionOverlay: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 10,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.rose[500],
    borderColor: Colors.rose[500],
  },

  // Content
  content: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.rose[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.neutral[400],
  },
});
