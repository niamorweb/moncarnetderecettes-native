import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  Animated,
  StatusBar,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { RecipeCard } from "@/components/RecipeCard";
import { EmptyState, Button } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { recipesApi, categoriesApi } from "@/utils/api";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import type { Recipe, Category } from "@/types";

// --- LIST HEADER COMPONENT (extracted to avoid re-mount on parent re-render) ---
type ListHeaderProps = {
  categories: Category[];
  selectedCategory: string | null;
  setSelectedCategory: (id: string | null) => void;
  isAddingCategory: boolean;
  setIsAddingCategory: (v: boolean) => void;
  isSubmittingCategory: boolean;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string, name: string) => void;
};

const ListHeader = React.memo(function ListHeader({
  categories,
  selectedCategory,
  setSelectedCategory,
  isAddingCategory,
  setIsAddingCategory,
  isSubmittingCategory,
  onAddCategory,
  onDeleteCategory,
}: ListHeaderProps) {
  const [localCategoryName, setLocalCategoryName] = useState("");
  const categoryInputRef = useRef<TextInput>(null);

  const handleSubmit = () => {
    if (localCategoryName.trim()) {
      onAddCategory(localCategoryName.trim());
      setLocalCategoryName("");
    } else {
      setIsAddingCategory(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmittingCategory) {
      setLocalCategoryName("");
      setIsAddingCategory(false);
    }
  };

  const handleStartAdding = () => {
    setIsAddingCategory(true);
    setTimeout(() => categoryInputRef.current?.focus(), 100);
  };

  return (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        keyboardShouldPersistTaps="always"
      >
        {/* "TOUS" Filter */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            !selectedCategory && styles.filterChipActive,
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text
            style={[
              styles.filterText,
              !selectedCategory && styles.filterTextActive,
            ]}
          >
            Toutes
          </Text>
        </TouchableOpacity>

        {/* DYNAMIC CATEGORIES */}
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat.id)}
              onLongPress={() => onDeleteCategory(cat.id, cat.name)}
            >
              <Text
                style={[styles.filterText, isActive && styles.filterTextActive]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* ADD CATEGORY INPUT */}
        {isAddingCategory ? (
          <View style={styles.addCategoryInputContainer}>
            <TextInput
              ref={categoryInputRef}
              style={styles.addCategoryInput}
              value={localCategoryName}
              onChangeText={setLocalCategoryName}
              placeholder="Nouvelle..."
              placeholderTextColor={Colors.neutral[400]}
              autoFocus
              editable={!isSubmittingCategory}
              onSubmitEditing={handleSubmit}
              onBlur={handleCancel}
              returnKeyType="done"
            />
            {isSubmittingCategory && (
              <ActivityIndicator
                size="small"
                color={Colors.rose[500]}
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addCategoryButton}
            onPress={handleStartAdding}
          >
            <Ionicons name="add" size={18} color={Colors.rose[500]} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
});

export default function DashboardScreen() {
  const router = useRouter();
  const {
    toast,
    error: showError,
    success: showSuccess,
    hide: hideToast,
  } = useToast();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Selection mode
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const isSelectionMode = selectedRecipes.length > 0;
  const bulkBarAnim = useRef(new Animated.Value(0)).current;

  // Category management
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  const navigation = useNavigation();

  const loadData = async () => {
    try {
      const [recipesData, categoriesData] = await Promise.all([
        recipesApi.getAll(),
        categoriesApi.getAll(),
      ]);

      setRecipes(recipesData || []);
      setCategories(categoriesData || []);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      showError("Erreur lors du chargement des recettes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // Add category
  const handleAddCategory = useCallback(async (categoryName: string) => {
    setIsSubmittingCategory(true);
    Keyboard.dismiss();

    try {
      await categoriesApi.create(categoryName);
      setIsAddingCategory(false);
      showSuccess("Catégorie créée");
      await loadData();
    } catch (err: any) {
      showError(err.message || "Erreur lors de la création");
    } finally {
      setIsSubmittingCategory(false);
    }
  }, []);

  // Delete category
  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    Alert.alert(
      `Supprimer "${categoryName}" ?`,
      "La catégorie sera supprimée, mais les recettes seront conservées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await categoriesApi.delete(categoryId);
              if (selectedCategory === categoryId) {
                setSelectedCategory(null);
              }
              showSuccess("Catégorie supprimée");
              await loadData();
            } catch (err: any) {
              showError(err.message || "Erreur lors de la suppression");
            }
          },
        },
      ],
    );
  };

  const handleSetIsAddingCategory = useCallback((v: boolean) => {
    setIsAddingCategory(v);
  }, []);

  // Animate bulk bar
  useEffect(() => {
    Animated.spring(bulkBarAnim, {
      toValue: isSelectionMode ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [isSelectionMode]);

  const toggleSelection = (id: string) => {
    setSelectedRecipes((prev) => {
      const next = prev.includes(id)
        ? prev.filter((r) => r !== id)
        : [...prev, id];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return next;
    });
  };

  const startSelection = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRecipes([id]);
  };

  const clearSelection = () => {
    setSelectedRecipes([]);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      `Supprimer ${selectedRecipes.length} recette${selectedRecipes.length > 1 ? "s" : ""} ?`,
      "Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await recipesApi.bulkDelete(selectedRecipes);
              clearSelection();
              showSuccess("Recettes supprimées");
              await loadData();
            } catch (err: any) {
              showError(err.message || "Erreur lors de la suppression");
            }
          },
        },
      ],
    );
  };

  // HEADER CONFIGURATION
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const filteredRecipes = recipes.filter(
    (r) => !selectedCategory || r.categoryId === selectedCategory,
  );

  const handleRecipePress = (recipe: Recipe) => {
    if (isSelectionMode) {
      toggleSelection(recipe.id);
      return;
    }
    router.push(`/(app)/recipe/${recipe.id}`);
  };

  const renderRecipe = ({ item, index }: { item: Recipe; index: number }) => (
    <View
      style={[
        styles.recipeItem,
        index % 2 === 0 ? styles.recipeItemLeft : styles.recipeItemRight,
      ]}
    >
      <RecipeCard
        recipe={item}
        isSelected={selectedRecipes.includes(item.id)}
        isSelectionMode={isSelectionMode}
        onPress={() => handleRecipePress(item)}
        onLongPress={() => startSelection(item.id)}
      />
    </View>
  );

  // --- SUB COMPONENTS ---

  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Mes recettes</Text>
      <View style={styles.headerButtons}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push("/(app)/scan-recipe")}
        >
          <Ionicons name="scan-outline" size={22} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(app)/new-recipe")}
        >
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const ListEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <EmptyState
          icon="restaurant-outline"
          title={
            recipes.length === 0 ? "Aucune recette" : "Cette catégorie est vide"
          }
          description="Ajoutez vos plats préférés pour les retrouver ici."
          style={{ marginTop: 40 }}
        >
          {recipes.length === 0 && (
            <Button
              onPress={() => router.push("/(app)/new-recipe")}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Créer une recette</Text>
            </Button>
          )}
        </EmptyState>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      <Header />

      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          isSelectionMode && { paddingBottom: 120 },
        ]}
        ListHeaderComponent={
          <ListHeader
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isAddingCategory={isAddingCategory}
            setIsAddingCategory={handleSetIsAddingCategory}
            isSubmittingCategory={isSubmittingCategory}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        }
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.rose[500]]}
            tintColor={Colors.rose[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FLOATING ACTION BAR */}
      <Animated.View
        pointerEvents={isSelectionMode ? "auto" : "none"}
        style={[
          styles.floatingBar,
          {
            opacity: bulkBarAnim,
            transform: [
              {
                translateY: bulkBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.floatingBarContent}>
          <TouchableOpacity
            onPress={clearSelection}
            style={styles.floatingIcon}
          >
            <Ionicons name="close" size={20} color={Colors.white} />
          </TouchableOpacity>

          <Text style={styles.floatingText}>
            {selectedRecipes.length} sélectionnée
            {selectedRecipes.length > 1 ? "s" : ""}
          </Text>

          <TouchableOpacity
            onPress={handleDeleteSelected}
            style={styles.floatingIcon}
          >
            <Ionicons name="trash" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },

  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.rose[500],
  },

  // Categories
  categoryContainer: {
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },

  // Filter Chips
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: Colors.rose[500],
    borderColor: Colors.rose[500],
  },
  filterText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[500],
  },
  filterTextActive: {
    color: Colors.white,
  },

  // Add Category
  addCategoryButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.rose[200],
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.rose[50],
  },
  addCategoryInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 38,
    borderWidth: 1,
    borderColor: Colors.rose[300],
  },
  addCategoryInput: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[900],
    fontWeight: FontWeights.medium,
    minWidth: 80,
  },

  // List & Grid
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
  },
  recipeItem: {
    flex: 1,
  },
  recipeItemLeft: {
    marginRight: Spacing.sm,
  },
  recipeItemRight: {
    marginLeft: Spacing.sm,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyButton: {
    backgroundColor: Colors.rose[500],
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
  },
  emptyButtonText: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
  },

  // Floating Bar
  floatingBar: {
    position: "absolute",
    bottom: 32,
    alignSelf: "center",
    zIndex: 100,
  },
  floatingBarContent: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[900],
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  floatingText: {
    color: Colors.white,
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.sm,
  },
  floatingIcon: {
    padding: 4,
  },
});
