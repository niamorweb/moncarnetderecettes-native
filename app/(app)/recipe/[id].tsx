import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { Card } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { recipesApi } from "@/utils/api";
import { useAuthStore } from "@/stores/auth";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import type { Recipe } from "@/types";

const { width } = Dimensions.get("window");
const IMAGE_HEIGHT = 300;

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const {
    toast,
    success: showSuccess,
    error: showError,
    hide: hideToast,
  } = useToast();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(
    new Set(),
  );
  const [deleting, setDeleting] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Header background animation (transparent -> white)
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const headerTextOpacity = scrollY.interpolate({
    inputRange: [IMAGE_HEIGHT - 60, IMAGE_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Image parallax
  const imageTranslateY = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
    outputRange: [IMAGE_HEIGHT / 2, 0, -IMAGE_HEIGHT / 3],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-IMAGE_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: "clamp",
  });

  useEffect(() => {
    if (id) loadRecipe();
  }, [id]);

  const loadRecipe = async () => {
    try {
      const data = await recipesApi.getById(id!);
      setRecipe(data);
    } catch (err) {
      console.error("Error loading recipe:", err);
      showError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (index: number) => {
    const newChecked = new Set(checkedIngredients);
    if (newChecked.has(index)) newChecked.delete(index);
    else newChecked.add(index);
    setCheckedIngredients(newChecked);
  };

  const handleEdit = () => {
    router.push(`/(app)/recipe/edit/${id}`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvre cette recette : ${recipe?.name ?? ""}`,
        url: `https://moncarnetderecettes.vercel.app/u/${user?.username}/recipe/${id}`,
      });
    } catch {}
  };

  const handleDelete = () => {
    Alert.alert(
      "Supprimer la recette",
      "Êtes-vous sûr ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await recipesApi.delete(id!);
              showSuccess("Recette supprimée");
              setTimeout(() => router.back(), 1000);
            } catch (err: any) {
              showError(err.message || "Erreur suppression");
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 3,
            borderColor: Colors.neutral[200],
            borderTopColor: Colors.rose[500],
          }}
        />
      </View>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.centerContent}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Colors.neutral[400]}
          />
          <Text style={styles.errorText}>Recette introuvable</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Retourner à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      {/* --- HEADER NAVIGATION (STICKY) --- */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.stickyHeaderContent}>
            <Animated.Text
              numberOfLines={1}
              style={[styles.stickyHeaderTitle, { opacity: headerTextOpacity }]}
            >
              {recipe.name}
            </Animated.Text>
          </View>
        </SafeAreaView>
        <View style={styles.headerBorderBottom} />
      </Animated.View>

      {/* Boutons fixes */}
      <SafeAreaView style={styles.fixedActions} edges={["top"]}>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <View style={styles.fixedActionsRight}>
          <TouchableOpacity style={styles.roundButton} onPress={handleEdit}>
            <Ionicons
              name="create-outline"
              size={28}
              color={Colors.neutral[900]}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.roundButton} onPress={handleShare}>
            <Ionicons
              name="share-outline"
              size={28}
              color={Colors.neutral[900]}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* --- IMAGE HERO --- */}
        <View style={styles.imageContainer}>
          <Animated.View
            style={[
              styles.imageWrapper,
              {
                transform: [
                  { translateY: imageTranslateY },
                  { scale: imageScale },
                ],
              },
            ]}
          >
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
                  size={64}
                  color={Colors.neutral[300]}
                />
              </View>
            )}
          </Animated.View>
        </View>

        {/* --- MAIN CONTENT --- */}
        <View style={styles.contentContainer}>
          {/* Title + Category */}
          <Text style={styles.title}>{recipe.name}</Text>
          {recipe.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {recipe.category.name}
              </Text>
            </View>
          )}

          {/* Metadata Card */}
          <Card style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <View style={styles.metaIconCircle}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={Colors.rose[600]}
                  />
                </View>
                <Text style={styles.metaValue}>{totalTime} min</Text>
                <Text style={styles.metaLabel}>Total</Text>
              </View>
              <View style={styles.metaSeparator} />
              <View style={styles.metaItem}>
                <View style={styles.metaIconCircle}>
                  <Ionicons
                    name="flame-outline"
                    size={20}
                    color={Colors.rose[600]}
                  />
                </View>
                <Text style={styles.metaValue}>
                  {recipe.cook_time || 0} min
                </Text>
                <Text style={styles.metaLabel}>Cuisson</Text>
              </View>
              <View style={styles.metaSeparator} />
              <View style={styles.metaItem}>
                <View style={styles.metaIconCircle}>
                  <Ionicons
                    name="people-outline"
                    size={20}
                    color={Colors.rose[600]}
                  />
                </View>
                <Text style={styles.metaValue}>{recipe.servings || 2}</Text>
                <Text style={styles.metaLabel}>Portions</Text>
              </View>
            </View>
          </Card>

          {/* Ingredients Card */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Ce qu'il vous faut</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ing, index) => {
                const isChecked = checkedIngredients.has(index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.ingredientRow}
                    onPress={() => toggleIngredient(index)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isChecked && styles.checkboxChecked,
                      ]}
                    >
                      {isChecked && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.ingredientText,
                        isChecked && styles.ingredientTextChecked,
                      ]}
                    >
                      {ing}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Steps Card */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>La préparation</Text>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </Card>

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>
              {deleting ? "Suppression..." : "Supprimer cette recette"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },

  // Sticky header
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    zIndex: 10,
  },
  stickyHeaderContent: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyHeaderTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
  },
  headerBorderBottom: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    width: "100%",
  },

  // Fixed action buttons
  fixedActions: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  fixedActionsRight: {
    flexDirection: "row",
    gap: 10,
  },
  roundButton: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // Scroll content
  scrollContent: {
    paddingBottom: Spacing["4xl"],
  },
  imageContainer: {
    height: IMAGE_HEIGHT,
    width: width,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  image: {
    flex: 1,
    width: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },

  // Content
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
    lineHeight: 32,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.rose[100],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
  },
  categoryBadgeText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },

  // Metadata card
  metaCard: {
    marginBottom: Spacing.xl,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.rose[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  metaValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },
  metaLabel: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[500],
  },
  metaSeparator: {
    width: 1,
    height: 40,
    backgroundColor: Colors.neutral[100],
  },

  // Section cards
  sectionCard: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    marginBottom: Spacing.xl,
  },

  // Ingredients
  ingredientsList: {
    gap: Spacing.md,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.neutral[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.rose[500],
    borderColor: Colors.rose[500],
  },
  ingredientText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
    lineHeight: 24,
  },
  ingredientTextChecked: {
    textDecorationLine: "line-through",
    color: Colors.neutral[400],
  },

  // Steps
  stepContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.rose[100],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },
  stepText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
    lineHeight: 24,
  },

  // Delete
  deleteButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  deleteButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    textDecorationLine: "underline",
    color: Colors.neutral[500],
  },

  // Error state
  errorText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  linkButton: {
    padding: Spacing.sm,
  },
  linkText: {
    color: Colors.rose[600],
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.base,
  },
});
