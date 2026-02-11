import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Animated,
  StatusBar,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { RecipePrint } from "@/components/RecipePrint";
import { Button, Card } from "@/components/ui";
import { recipesApi, api } from "@/utils/api";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import type { Recipe } from "@/types";

const API_BASE = process.env.EXPO_PUBLIC_API_URL || "";

const SIDEBAR_WIDTH = 320;
const { width } = Dimensions.get("window");

// Order options
const COVER_OPTIONS = [
  {
    id: "hardcover",
    name: "Couverture Rigide",
    desc: "Robuste et élégant",
    icon: "book",
    price: 25,
  },
  {
    id: "softcover",
    name: "Couverture Souple",
    desc: "Léger et flexible",
    icon: "document-text",
    price: 15,
  },
];

const PAPER_OPTIONS = [
  {
    id: "standard_matte",
    name: "Standard Mat",
    desc: "Rendu naturel",
    icon: "newspaper",
    price: 0,
  },
  {
    id: "premium_silk",
    name: "Premium Silk",
    desc: "Toucher soyeux",
    icon: "sparkles",
    price: 5,
  },
];

const FINISH_OPTIONS = [
  {
    id: "matte",
    name: "Lamination Mate",
    desc: "Moderne et sobre",
    icon: "contrast",
  },
  {
    id: "glossy",
    name: "Lamination Brillante",
    desc: "Éclatant et vif",
    icon: "sunny",
  },
];

const TOTAL_STEPS = 5;

export default function PdfViewerScreen() {
  const {
    toast,
    error: showError,
    success: showSuccess,
    hide: hideToast,
  } = useToast();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  const sidebarOpenRef = useRef(false);

  // Order modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderConfig, setOrderConfig] = useState({
    coverType: null as string | null,
    paperType: null as string | null,
    finishType: null as string | null,
    quantity: 1,
  });
  const [shipping, setShipping] = useState({
    name: "",
    line1: "",
    city: "",
    postalCode: "",
    country: "FR",
  });

  const totalPrice = useMemo(() => {
    let total = 0;
    const cover = COVER_OPTIONS.find((c) => c.id === orderConfig.coverType);
    if (cover) total += cover.price;
    const paper = PAPER_OPTIONS.find((p) => p.id === orderConfig.paperType);
    if (paper) total += paper.price;
    return total * orderConfig.quantity;
  }, [orderConfig]);

  const canProceed = useMemo(() => {
    if (currentStep === 1) return !!orderConfig.coverType;
    if (currentStep === 2) return !!orderConfig.paperType;
    if (currentStep === 3) return !!orderConfig.finishType;
    if (currentStep === 4) {
      return (
        shipping.name.length > 2 &&
        shipping.line1.length > 5 &&
        shipping.city.length > 2 &&
        shipping.postalCode.length > 4
      );
    }
    return true;
  }, [currentStep, orderConfig, shipping]);

  const handleToggleSidebar = useCallback(() => {
    const opening = !sidebarOpenRef.current;
    sidebarOpenRef.current = opening;
    setSidebarOpen(opening);
    Animated.spring(sidebarAnim, {
      toValue: opening ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [sidebarAnim]);

  const closeSidebar = useCallback(() => {
    sidebarOpenRef.current = false;
    setSidebarOpen(false);
    Animated.spring(sidebarAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [sidebarAnim]);

  const fetchRecipes = useCallback(async () => {
    try {
      const data = await recipesApi.getAll();
      setRecipes(data || []);
    } catch (err: any) {
      showError(err.message || "Impossible de charger les recettes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= recipes.length) return;

    const items = [...recipes];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    setRecipes(items);

    if (activeRecipeIndex === index) setActiveRecipeIndex(newIndex);
    else if (activeRecipeIndex === newIndex) setActiveRecipeIndex(index);
  };

  const selectRecipe = (index: number) => {
    setActiveRecipeIndex(index);
    if (width < 768) closeSidebar();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      // Open PDF download in browser
      const pdfUrl = `${API_BASE}/recipes/pdf/print-all`;
      await Linking.openURL(pdfUrl);
      showSuccess("Ouverture du PDF...");
    } catch (err: any) {
      showError("Erreur lors du téléchargement");
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateOrder = async () => {
    setIsOrdering(true);
    try {
      const payload = {
        amountTotal: Math.round(totalPrice * 100),
        currency: "eur",
        quantity: orderConfig.quantity,
        printOptions: { ...orderConfig },
        shippingAddress: { ...shipping },
      };

      const response = (await api("/orders", {
        method: "POST",
        body: JSON.stringify(payload),
      })) as { checkoutUrl?: string };

      if (response.checkoutUrl) {
        await Linking.openURL(response.checkoutUrl);
      }

      showSuccess("Commande créée !");
      setShowOrderModal(false);
    } catch (err: any) {
      showError(err.message || "Erreur lors de la commande");
    } finally {
      setIsOrdering(false);
    }
  };

  const resetOrderModal = () => {
    setCurrentStep(1);
    setOrderConfig({
      coverType: null,
      paperType: null,
      finishType: null,
      quantity: 1,
    });
    setShipping({
      name: "",
      line1: "",
      city: "",
      postalCode: "",
      country: "FR",
    });
  };

  const activeRecipe = recipes[activeRecipeIndex];
  const filteredRecipes = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const goNext = () => {
    if (activeRecipeIndex < recipes.length - 1)
      setActiveRecipeIndex(activeRecipeIndex + 1);
  };
  const goPrev = () => {
    if (activeRecipeIndex > 0) setActiveRecipeIndex(activeRecipeIndex - 1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.spinner} />
      </View>
    );
  }

  const renderOptionCard = (
    option: {
      id: string;
      name: string;
      desc: string;
      icon: string;
      price?: number;
    },
    isSelected: boolean,
    onSelect: () => void,
  ) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.optionCard, isSelected && styles.optionCardSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View
        style={[styles.optionIcon, isSelected && styles.optionIconSelected]}
      >
        <Ionicons
          name={option.icon as any}
          size={24}
          color={isSelected ? Colors.rose[600] : Colors.neutral[500]}
        />
      </View>
      <View style={styles.optionContent}>
        <Text
          style={[styles.optionName, isSelected && styles.optionNameSelected]}
        >
          {option.name}
        </Text>
        <Text style={styles.optionDesc}>{option.desc}</Text>
      </View>
      {option.price !== undefined && (
        <View style={styles.optionPrice}>
          <Text style={styles.optionPriceText}>+{option.price}€</Text>
        </View>
      )}
      {isSelected && (
        <View style={styles.optionCheck}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={Colors.rose[500]}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerButton} />
          <Text style={styles.headerTitle}>Mon Carnet</Text>
          <TouchableOpacity
            onPress={handleToggleSidebar}
            style={styles.headerButton}
          >
            <Ionicons name="list" size={24} color={Colors.neutral[900]} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Main Content */}
      <View style={styles.viewerContainer}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {activeRecipe ? (
            <View style={styles.paperSheet}>
              <RecipePrint recipe={activeRecipe} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={Colors.neutral[300]}
              />
              <Text style={styles.emptyText}>Aucune recette sélectionnée</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <SafeAreaView edges={["bottom"]}>
          <View style={styles.footerContent}>
            <TouchableOpacity
              onPress={goPrev}
              disabled={activeRecipeIndex === 0}
              style={[
                styles.navButton,
                activeRecipeIndex === 0 && styles.navButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={
                  activeRecipeIndex === 0
                    ? Colors.neutral[300]
                    : Colors.neutral[900]
                }
              />
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageText}>
                <Text style={{ fontWeight: FontWeights.bold }}>
                  {activeRecipeIndex + 1}
                </Text>
                {" / "}
                {recipes.length}
              </Text>
            </View>

            <TouchableOpacity
              onPress={goNext}
              disabled={activeRecipeIndex === recipes.length - 1}
              style={[
                styles.navButton,
                activeRecipeIndex === recipes.length - 1 &&
                  styles.navButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={
                  activeRecipeIndex === recipes.length - 1
                    ? Colors.neutral[300]
                    : Colors.neutral[900]
                }
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Sidebar Overlay */}
      <Animated.View
        pointerEvents={sidebarOpen ? "auto" : "none"}
        style={[
          styles.overlay,
          {
            opacity: sidebarAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.5],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={closeSidebar}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sidebar */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [
              {
                translateX: sidebarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [SIDEBAR_WIDTH, 0],
                }),
              },
            ],
          },
        ]}
      >
        <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
          {/* Sidebar Header */}
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarTitleRow}>
              <View style={styles.sidebarIconCircle}>
                <Ionicons
                  name="layers-outline"
                  size={20}
                  color={Colors.rose[600]}
                />
              </View>
              <Text style={styles.sidebarTitle}>Sommaire</Text>
            </View>
            <TouchableOpacity onPress={closeSidebar} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color={Colors.neutral[900]} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={Colors.neutral[400]} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Filtrer les recettes..."
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>
          </View>

          {/* List */}
          <FlatList
            data={filteredRecipes}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const originalIndex = recipes.findIndex((r) => r.id === item.id);
              const isActive = originalIndex === activeRecipeIndex;

              return (
                <View
                  style={[styles.listItem, isActive && styles.listItemActive]}
                >
                  <TouchableOpacity
                    style={styles.listItemContent}
                    onPress={() => selectRecipe(originalIndex)}
                  >
                    <Image
                      source={
                        item.image_url ? { uri: item.image_url } : undefined
                      }
                      style={styles.listThumb}
                      contentFit="cover"
                    />
                    <Text
                      style={[
                        styles.listText,
                        isActive && styles.listTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.moveControls}>
                    <TouchableOpacity
                      onPress={() => moveItem(originalIndex, "up")}
                      style={styles.moveBtn}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={16}
                        color={Colors.neutral[400]}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => moveItem(originalIndex, "down")}
                      style={styles.moveBtn}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={Colors.neutral[400]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />

          {/* Sidebar Footer with buttons */}
          <View style={styles.sidebarFooter}>
            <Button
              variant="outline"
              onPress={handleDownloadPdf}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator size="small" color={Colors.rose[600]} />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={Colors.rose[600]}
                />
              )}
              <Text style={styles.downloadButtonText}>Télécharger le PDF</Text>
            </Button>

            <Button
              onPress={() => {
                resetOrderModal();
                setShowOrderModal(true);
              }}
            >
              <Ionicons name="book-outline" size={20} color={Colors.white} />
              <Text style={styles.orderButtonText}>Commander mon carnet</Text>
            </Button>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Order Modal */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Commander mon carnet</Text>
              <Text style={styles.modalSubtitle}>
                Étape {currentStep} sur {TOTAL_STEPS}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowOrderModal(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={Colors.neutral[900]} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(
              (step) => (
                <View
                  key={step}
                  style={[
                    styles.progressBar,
                    step <= currentStep && styles.progressBarActive,
                  ]}
                />
              ),
            )}
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Step 1: Cover */}
              {currentStep === 1 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Type de couverture</Text>
                  <Text style={styles.stepDesc}>
                    Choisissez la couverture qui vous correspond
                  </Text>
                  <View style={styles.optionsGrid}>
                    {COVER_OPTIONS.map((opt) =>
                      renderOptionCard(
                        opt,
                        orderConfig.coverType === opt.id,
                        () =>
                          setOrderConfig((p) => ({ ...p, coverType: opt.id })),
                      ),
                    )}
                  </View>
                </View>
              )}

              {/* Step 2: Paper */}
              {currentStep === 2 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Choix du papier</Text>
                  <Text style={styles.stepDesc}>
                    La qualité du papier pour vos recettes
                  </Text>
                  <View style={styles.optionsGrid}>
                    {PAPER_OPTIONS.map((opt) =>
                      renderOptionCard(
                        opt,
                        orderConfig.paperType === opt.id,
                        () =>
                          setOrderConfig((p) => ({ ...p, paperType: opt.id })),
                      ),
                    )}
                  </View>
                </View>
              )}

              {/* Step 3: Finish */}
              {currentStep === 3 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Finition</Text>
                  <Text style={styles.stepDesc}>
                    La touche finale pour votre carnet
                  </Text>
                  <View style={styles.optionsGrid}>
                    {FINISH_OPTIONS.map((opt) =>
                      renderOptionCard(
                        { ...opt, price: undefined },
                        orderConfig.finishType === opt.id,
                        () =>
                          setOrderConfig((p) => ({ ...p, finishType: opt.id })),
                      ),
                    )}
                  </View>
                </View>
              )}

              {/* Step 4: Shipping */}
              {currentStep === 4 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Adresse de livraison</Text>
                  <Text style={styles.stepDesc}>
                    Où souhaitez-vous recevoir votre carnet ?
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nom complet</Text>
                    <TextInput
                      style={styles.input}
                      value={shipping.name}
                      onChangeText={(t) =>
                        setShipping((s) => ({ ...s, name: t }))
                      }
                      placeholder="Jean Dupont"
                      placeholderTextColor={Colors.neutral[400]}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Adresse</Text>
                    <TextInput
                      style={styles.input}
                      value={shipping.line1}
                      onChangeText={(t) =>
                        setShipping((s) => ({ ...s, line1: t }))
                      }
                      placeholder="10 rue de la Paix"
                      placeholderTextColor={Colors.neutral[400]}
                    />
                  </View>

                  <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Code postal</Text>
                      <TextInput
                        style={styles.input}
                        value={shipping.postalCode}
                        onChangeText={(t) =>
                          setShipping((s) => ({ ...s, postalCode: t }))
                        }
                        placeholder="75001"
                        placeholderTextColor={Colors.neutral[400]}
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1.5 }]}>
                      <Text style={styles.inputLabel}>Ville</Text>
                      <TextInput
                        style={styles.input}
                        value={shipping.city}
                        onChangeText={(t) =>
                          setShipping((s) => ({ ...s, city: t }))
                        }
                        placeholder="Paris"
                        placeholderTextColor={Colors.neutral[400]}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Step 5: Summary */}
              {currentStep === 5 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Récapitulatif</Text>
                  <Text style={styles.stepDesc}>
                    Vérifiez votre commande avant paiement
                  </Text>

                  {/* Price card */}
                  <View style={styles.priceCard}>
                    <View>
                      <Text style={styles.priceLabel}>Total à payer</Text>
                      <Text style={styles.priceValue}>{totalPrice}€</Text>
                    </View>
                    <View style={styles.priceRight}>
                      <Text style={styles.priceTva}>TVA incluse</Text>
                    </View>
                  </View>

                  {/* Summary card */}
                  <Card style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelRow}>
                        <Ionicons
                          name="book"
                          size={16}
                          color={Colors.neutral[400]}
                        />
                        <Text style={styles.summaryLabel}>Couverture</Text>
                      </View>
                      <Text style={styles.summaryValue}>
                        {COVER_OPTIONS.find(
                          (c) => c.id === orderConfig.coverType,
                        )?.name || "-"}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelRow}>
                        <Ionicons
                          name="newspaper"
                          size={16}
                          color={Colors.neutral[400]}
                        />
                        <Text style={styles.summaryLabel}>Papier</Text>
                      </View>
                      <Text style={styles.summaryValue}>
                        {PAPER_OPTIONS.find(
                          (p) => p.id === orderConfig.paperType,
                        )?.name || "-"}
                      </Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelRow}>
                        <Ionicons
                          name="location"
                          size={16}
                          color={Colors.neutral[400]}
                        />
                        <Text style={styles.summaryLabel}>Livraison</Text>
                      </View>
                      <Text style={styles.summaryValue}>
                        {shipping.city || "-"}, {shipping.country}
                      </Text>
                    </View>
                  </Card>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Modal Footer */}
          <SafeAreaView edges={["bottom"]} style={styles.modalFooter}>
            <View style={styles.modalFooterContent}>
              {currentStep > 1 ? (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setCurrentStep((s) => s - 1)}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={Colors.neutral[600]}
                  />
                  <Text style={styles.backBtnText}>Retour</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}

              {currentStep < TOTAL_STEPS ? (
                <TouchableOpacity
                  style={[
                    styles.nextBtn,
                    !canProceed && styles.nextBtnDisabled,
                  ]}
                  onPress={() => setCurrentStep((s) => s + 1)}
                  disabled={!canProceed}
                >
                  <Text style={styles.nextBtnText}>Suivant</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={Colors.white}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handleCreateOrder}
                  disabled={isOrdering}
                >
                  {isOrdering ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.payBtnText}>Commander & Payer</Text>
                      <Ionicons name="card" size={20} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.neutral[50],
  },
  spinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.neutral[200],
    borderTopColor: Colors.rose[500],
  },

  // Header
  header: {
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  headerContent: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  paperSheet: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    minHeight: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: Spacing.md,
    color: Colors.neutral[500],
    fontSize: FontSizes.base,
  },

  // Footer
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  pageIndicator: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  pageText: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[900],
  },

  // Sidebar
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "black",
    zIndex: 20,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: Colors.white,
    zIndex: 30,
    shadowColor: "#000",
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  sidebarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sidebarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.rose[50],
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },
  closeIcon: {
    padding: 4,
  },
  searchContainer: {
    padding: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: FontSizes.sm,
    color: Colors.neutral[900],
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.neutral[100],
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  listItemActive: {
    borderColor: Colors.rose[500],
    borderWidth: 2,
  },
  listItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
  },
  listThumb: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.neutral[100],
    marginRight: Spacing.sm,
  },
  listText: {
    flex: 1,
    fontSize: FontSizes.sm,
    color: Colors.neutral[900],
    fontWeight: FontWeights.medium,
  },
  listTextActive: {
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },
  moveControls: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.neutral[100],
  },
  moveBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },

  // Sidebar footer buttons
  sidebarFooter: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
    gap: Spacing.sm,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.rose[200],
    backgroundColor: Colors.white,
  },
  downloadButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },
  orderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.rose[500],
  },
  orderButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    paddingTop: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[200],
  },
  progressBarActive: {
    backgroundColor: Colors.rose[500],
  },
  modalContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  stepContent: {
    gap: Spacing.lg,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },
  stepDesc: {
    fontSize: FontSizes.base,
    color: Colors.neutral[500],
    marginTop: -Spacing.sm,
  },
  optionsGrid: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.neutral[100],
    gap: Spacing.md,
  },
  optionCardSelected: {
    borderColor: Colors.rose[500],
    backgroundColor: Colors.rose[50],
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconSelected: {
    backgroundColor: Colors.rose[100],
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
  },
  optionNameSelected: {
    color: Colors.rose[700],
  },
  optionDesc: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  optionPrice: {
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  optionPriceText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[600],
  },
  optionCheck: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },

  // Inputs
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[500],
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },

  // Summary
  priceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.neutral[900],
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  priceLabel: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
  },
  priceValue: {
    fontSize: 32,
    fontWeight: FontWeights.black,
    color: Colors.white,
  },
  priceRight: {
    alignItems: "flex-end",
  },
  priceTva: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[400],
  },
  summaryCard: {
    marginTop: Spacing.lg,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },
  summaryValue: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.neutral[900],
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
  },

  // Modal footer
  modalFooter: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  modalFooterContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  backBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[600],
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.neutral[900],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.rose[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  payBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
});
