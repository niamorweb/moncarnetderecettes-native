import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/utils/api";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    toast,
    success: showSuccess,
    error: showError,
    hide: hideToast,
  } = useToast();

  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState(user?.email || "");

  // Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || newEmail.trim() === user?.email) return;

    setSavingEmail(true);
    try {
      await api("/auth/update-email", {
        method: "PATCH",
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      showSuccess("Email mis à jour !");
    } catch (err: any) {
      showError(err.message || "Erreur lors du changement d'email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setSavingPassword(true);
    try {
      await api("/auth/update-password", {
        method: "PATCH",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      showSuccess("Mot de passe mis à jour !");
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      showError(err.message || "Erreur lors du changement de mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Êtes-vous sûr de vouloir vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const isEmailChanged = newEmail.trim() && newEmail.trim() !== user?.email;
  const isPasswordValid = oldPassword && newPassword.length >= 8;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerButton} />
        <Text style={styles.headerTitle}>Mon compte</Text>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Email Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={Colors.rose[600]}
                />
              </View>
              <Text style={styles.sectionTitle}>Adresse e-mail</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email actuel</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="votre@email.com"
                placeholderTextColor={Colors.neutral[400]}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <Button
              onPress={handleChangeEmail}
              disabled={!isEmailChanged || savingEmail}
            >
              {savingEmail ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.actionButtonText}>Enregistrer</Text>
              )}
            </Button>
          </Card>

          {/* Password Section */}
          <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconCircle}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={Colors.rose[600]}
                />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Sécurité</Text>
                <Text style={styles.sectionSubtitle}>
                  Mettre à jour votre mot de passe
                </Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mot de passe actuel</Text>
              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.neutral[400]}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="8 caractères min."
                placeholderTextColor={Colors.neutral[400]}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <Button
              onPress={handleChangePassword}
              disabled={!isPasswordValid || savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Modifier le mot de passe
                </Text>
              )}
            </Button>
          </Card>

          {/* Logout Section */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.neutral[500]}
            />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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

  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },

  // Section cards
  sectionCard: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.rose[50],
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  // Inputs
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
  },

  // Buttons
  actionButton: {
    backgroundColor: Colors.rose[500],
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
  },
  actionButtonDisabled: {
    backgroundColor: Colors.neutral[200],
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  logoutText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    textDecorationLine: "underline",
    color: Colors.neutral[500],
  },
  versionText: {
    textAlign: "center",
    color: Colors.neutral[400],
    fontSize: FontSizes.xs,
  },
});
