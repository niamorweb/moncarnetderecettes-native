import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { Input, Card } from "@/components/ui";
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
import type { Category } from "@/types";

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    toast,
    success: showSuccess,
    error: showError,
    hide: hideToast,
  } = useToast();

  const [loading, setLoading] = useState(false);
  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  // Recipe data
  const [name, setName] = useState("");
  const [servings, setServings] = useState("4");
  const [prepTime, setPrepTime] = useState("15");
  const [cookTime, setCookTime] = useState("30");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [steps, setSteps] = useState<string[]>([""]);

  // Image
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [recipeData, categoriesData] = await Promise.all([
        recipesApi.getById(id!),
        categoriesApi.getAll(),
      ]);

      setCategories(categoriesData || []);

      if (recipeData) {
        setName(recipeData.name || "");
        setServings(String(recipeData.servings || 4));
        setPrepTime(String(recipeData.prep_time || 0));
        setCookTime(String(recipeData.cook_time || 0));
        setSelectedCategory(recipeData.categoryId || null);
        setCurrentImageUrl(recipeData.image_url || null);
        setIngredients(
          recipeData.ingredients?.length > 0 ? recipeData.ingredients : [""],
        );
        setSteps(recipeData.steps?.length > 0 ? recipeData.steps : [""]);
      }
    } catch (err) {
      console.error("Error loading recipe:", err);
      showError("Erreur lors du chargement de la recette");
    } finally {
      setLoadingRecipe(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
    }
  };

  const imagePreview = newImageUri || currentImageUrl;

  const addIngredient = () => setIngredients([...ingredients, ""]);

  const updateIngredient = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const addStep = () => setSteps([...steps, ""]);

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showError("Le nom de la recette est requis");
      return;
    }

    const filteredIngredients = ingredients.filter((i) => i.trim());
    const filteredSteps = steps.filter((s) => s.trim());

    if (filteredIngredients.length === 0) {
      showError("Ajoutez au moins un ingrédient");
      return;
    }
    if (filteredSteps.length === 0) {
      showError("Ajoutez au moins une étape");
      return;
    }

    setLoading(true);

    try {
      if (newImageUri) {
        const formData = new FormData();
        formData.append("name", name.trim());
        formData.append("servings", String(parseInt(servings) || 4));
        formData.append("prep_time", String(parseInt(prepTime) || 0));
        formData.append("cook_time", String(parseInt(cookTime) || 0));
        if (selectedCategory) formData.append("categoryId", selectedCategory);
        filteredIngredients.forEach((i) =>
          formData.append("ingredients[]", i),
        );
        filteredSteps.forEach((s) => formData.append("steps[]", s));
        formData.append("image", {
          uri: newImageUri,
          type: "image/jpeg",
          name: "recipe.jpg",
        } as any);

        await recipesApi.updateWithImage(id!, formData);
      } else {
        await recipesApi.update(id!, {
          name: name.trim(),
          servings: parseInt(servings) || 4,
          prep_time: parseInt(prepTime) || 0,
          cook_time: parseInt(cookTime) || 0,
          categoryId: selectedCategory,
          ingredients: filteredIngredients,
          steps: filteredSteps,
        });
      }

      showSuccess("Recette mise à jour !");
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (err: any) {
      showError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (loadingRecipe) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={Colors.rose[500]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.customHeader}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier la recette</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Ionicons name="checkmark" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
      </View>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image */}
        <TouchableOpacity
          style={styles.imagePickerContainer}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {imagePreview ? (
            <View style={styles.imagePreviewWrapper}>
              <Image
                source={{ uri: imagePreview }}
                style={styles.imagePreview}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={22} color={Colors.white} />
                <Text style={styles.imageOverlayText}>Changer la photo</Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons
                name="image-outline"
                size={48}
                color={Colors.neutral[300]}
              />
              <Text style={styles.imagePlaceholderText}>Ajouter une photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Informations */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>

          <Input
            label="Nom de la recette"
            placeholder="Ex: Tarte aux pommes"
            value={name}
            onChangeText={setName}
            icon="restaurant-outline"
          />

          {/* Category selector */}
          <Text style={styles.label}>Catégorie</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryText,
                  !selectedCategory && styles.categoryTextActive,
                ]}
              >
                Aucune
              </Text>
            </TouchableOpacity>

            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Time and servings */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Portions"
                placeholder="4"
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                icon="people-outline"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Préparation (min)"
                placeholder="15"
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
                icon="time-outline"
              />
            </View>
          </View>

          <Input
            label="Cuisson (min)"
            placeholder="30"
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="numeric"
            icon="flame-outline"
          />
        </Card>

        {/* Ingredients */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Ingrédients</Text>

          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemNumber}>
                <Text style={styles.listItemNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={styles.listItemInput}
                placeholder="Ex: 200g de farine"
                value={ingredient}
                onChangeText={(value) => updateIngredient(index, value)}
                placeholderTextColor={Colors.neutral[400]}
              />
              {ingredients.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeIngredient(index)}
                  style={styles.removeButton}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={Colors.neutral[400]}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
            <Ionicons name="add" size={20} color={Colors.rose[600]} />
            <Text style={styles.addButtonText}>Ajouter un ingrédient</Text>
          </TouchableOpacity>
        </Card>

        {/* Steps */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Étapes</Text>

          {steps.map((step, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.listItemNumber}>
                <Text style={styles.listItemNumberText}>{index + 1}</Text>
              </View>
              <TextInput
                style={[styles.listItemInput, styles.stepInput]}
                placeholder="Décrivez cette étape..."
                value={step}
                onChangeText={(value) => updateStep(index, value)}
                placeholderTextColor={Colors.neutral[400]}
                multiline
                numberOfLines={2}
              />
              {steps.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeStep(index)}
                  style={styles.removeButton}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={Colors.neutral[400]}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addStep}>
            <Ionicons name="add" size={20} color={Colors.rose[600]} />
            <Text style={styles.addButtonText}>Ajouter une étape</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral[50],
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },

  // Image picker
  imagePickerContainer: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  imagePreviewWrapper: {
    position: "relative",
    aspectRatio: 16 / 9,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  imageOverlayText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  imagePlaceholder: {
    aspectRatio: 16 / 9,
    backgroundColor: Colors.neutral[100],
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  imagePlaceholderText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[400],
  },

  // Sections
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    marginBottom: Spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.neutral[100],
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.rose[500],
  },
  categoryText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[600],
  },
  categoryTextActive: {
    color: Colors.white,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  listItemNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.rose[100],
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  listItemNumberText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },
  listItemInput: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
  },
  stepInput: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  removeButton: {
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.rose[200],
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.rose[50],
  },
  addButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },
});
