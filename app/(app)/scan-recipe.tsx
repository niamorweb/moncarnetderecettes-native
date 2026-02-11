import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { Button, Card } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { geminiApi } from "@/utils/api";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function ScanRecipeScreen() {
  const router = useRouter();
  const { toast, error: showError, hide: hideToast } = useToast();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the icon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const pickImage = async (useCamera: boolean) => {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission requise",
            "L'accès à la caméra est nécessaire pour prendre une photo."
          );
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission requise",
            "L'accès à la galerie est nécessaire pour sélectionner une photo."
          );
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error("Error picking image:", err);
      showError("Erreur lors de la sélection de l'image");
    }
  };

  const resetImage = () => {
    setImageUri(null);
  };

  const startAnalysis = async () => {
    if (!imageUri) return;

    setIsAnalyzing(true);

    try {
      const extractedData = await geminiApi.extractRecipe(imageUri);

      // Navigate to new-recipe with extracted data and image
      router.push({
        pathname: "/(app)/new-recipe",
        params: {
          source: "scan",
          data: JSON.stringify(extractedData),
          imageUri: imageUri,
        },
      });
    } catch (err: any) {
      console.error("Error analyzing image:", err);
      showError(err.message || "Erreur lors de l'analyse de la recette");
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner une recette</Text>
        <View style={styles.headerButton} />
      </View>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      {!imageUri ? (
        // Initial state - show import card
        <View style={styles.content}>
          <Card style={styles.importCard}>
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons name="download-outline" size={48} color={Colors.rose[500]} />
            </Animated.View>

            <Text style={styles.title}>Importez une photo</Text>
            <Text style={styles.subtitle}>
              Assurez-vous que le texte de la recette soit bien lisible et
              éclairé.
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => pickImage(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, styles.cameraIcon]}>
                  <Ionicons name="camera" size={24} color={Colors.rose[600]} />
                </View>
                <Text style={styles.optionText}>Prendre une photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => pickImage(false)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, styles.galleryIcon]}>
                  <Ionicons name="images" size={24} color={Colors.info.main} />
                </View>
                <Text style={styles.optionText}>Choisir dans la galerie</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.hint}>
              Nous utilisons l'IA pour extraire les ingrédients et les
              instructions automatiquement.
            </Text>
          </Card>
        </View>
      ) : (
        // Image selected - show preview
        <View style={styles.previewContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              contentFit="contain"
            />

            {/* Analyzing overlay */}
            {isAnalyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color={Colors.rose[500]} />
                <Text style={styles.analyzingText}>
                  Lecture de la recette...
                </Text>
                <Text style={styles.analyzingSubtext}>
                  Cela peut prendre quelques secondes
                </Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          {!isAnalyzing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetImage}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={Colors.neutral[600]} />
              </TouchableOpacity>

              <Button onPress={startAnalysis} size="lg" style={styles.scanButton}>
                <Ionicons name="scan" size={20} color={Colors.white} />
                <Text style={styles.scanButtonText}>Scanner</Text>
              </Button>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
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
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "center",
  },
  importCard: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.rose[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.neutral[500],
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 22,
  },
  buttonGroup: {
    width: "100%",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    backgroundColor: Colors.rose[100],
  },
  galleryIcon: {
    backgroundColor: Colors.info.light,
  },
  optionText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[900],
  },
  hint: {
    fontSize: FontSizes.xs,
    color: Colors.neutral[400],
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.lg,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  imageWrapper: {
    flex: 1,
    position: "relative",
  },
  previewImage: {
    flex: 1,
    width: "100%",
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  analyzingText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginTop: Spacing.lg,
  },
  analyzingSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
    marginTop: Spacing.xs,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    paddingBottom: Spacing["3xl"],
    backgroundColor: Colors.white,
  },
  resetButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    flex: 1,
    marginLeft: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  scanButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
