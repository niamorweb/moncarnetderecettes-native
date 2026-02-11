import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from "@/constants/theme";
import type { Recipe } from "@/types";

interface RecipePrintProps {
  recipe: Recipe;
}

export function RecipePrint({ recipe }: RecipePrintProps) {
  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.recipeName}>{recipe.name}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="people-outline" size={16} color={Colors.neutral[600]} />
            <Text style={styles.metaText}>
              {recipe.servings} {recipe.servings > 1 ? "pers." : "pers."}
            </Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="time-outline" size={16} color={Colors.neutral[600]} />
            <Text style={styles.metaText}>{recipe.prep_time} min</Text>
          </View>
        </View>
      </View>

      {/* Image + Ingredients overlay */}
      <View style={styles.imageSection}>
        <View style={styles.imageContainer}>
          {recipe.image_url ? (
            <Image
              source={{ uri: recipe.image_url }}
              style={styles.image}
              contentFit="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="restaurant-outline" size={40} color={Colors.neutral[300]} />
              <Text style={styles.placeholderText}>Aucune illustration</Text>
            </View>
          )}
        </View>

        {/* Ingredients card overlapping image */}
        <View style={styles.ingredientsCard}>
          <Text style={styles.ingredientsTitle}>Ingrédients</Text>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientRow}>
              <View style={styles.ingredientDot} />
              <Text style={styles.ingredientText}>{ing}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Steps */}
      <View style={styles.stepsSection}>
        <Text style={styles.stepsTitle}>Préparation</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{i + 1}.</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>Mon Carnet de Recettes</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: Colors.white,
    padding: Spacing["2xl"],
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },

  // Header
  header: {
    alignItems: "flex-end",
    marginBottom: Spacing.lg,
  },
  recipeName: {
    fontFamily: "Georgia",
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    textAlign: "right",
    lineHeight: 36,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontFamily: "Georgia",
    fontSize: FontSizes.base,
    color: Colors.neutral[600],
  },

  // Image section
  imageSection: {
    marginBottom: Spacing.xl,
  },
  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: BorderRadius["3xl"],
    overflow: "hidden",
    backgroundColor: Colors.neutral[100],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  placeholderText: {
    fontFamily: "Georgia",
    fontStyle: "italic",
    color: Colors.neutral[400],
    fontSize: FontSizes.sm,
  },

  // Ingredients card
  ingredientsCard: {
    backgroundColor: "#f2eeeb",
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.lg,
    marginTop: -Spacing["3xl"],
    marginLeft: "45%",
    zIndex: 10,
  },
  ingredientsTitle: {
    fontFamily: "Georgia",
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  ingredientDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.rose[500],
    marginTop: 7,
  },
  ingredientText: {
    flex: 1,
    fontFamily: "Georgia",
    fontSize: FontSizes.sm,
    color: Colors.neutral[700],
    lineHeight: 18,
  },

  // Steps
  stepsSection: {
    marginBottom: Spacing.xl,
  },
  stepsTitle: {
    fontFamily: "Georgia",
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
    marginBottom: Spacing.lg,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  stepNumber: {
    width: 24,
    fontWeight: FontWeights.black,
    fontSize: FontSizes.base,
    color: Colors.rose[500],
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.neutral[700],
    lineHeight: 20,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    paddingTop: Spacing.md,
    alignItems: "center",
  },
  footerBrand: {
    fontFamily: "monospace",
    fontSize: FontSizes.xs,
    color: Colors.neutral[400],
  },
});
