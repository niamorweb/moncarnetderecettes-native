import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Button, Input } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { api } from "@/utils/api";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";

export default function SignupScreen() {
  const router = useRouter();
  const {
    toast,
    success: showSuccess,
    error: showError,
    hide: hideToast,
  } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError("Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      showError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      showError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        requiresAuth: false,
      });

      showSuccess("Compte créé ! Vérifiez votre email.");
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 2000);
    } catch (err: any) {
      showError(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={hideToast}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="book" size={32} color={Colors.rose[500]} />
            </View>
            <Text style={styles.logoText}>Mon Carnet de Recettes</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Créer un compte</Text>
            <Text style={styles.subtitle}>
              Rejoignez Mon Carnet de Recettes et créez votre carnet de recettes
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              icon="mail-outline"
            />

            <Input
              label="Mot de passe"
              placeholder="Min. 8 caractères"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              icon="lock-closed-outline"
            />

            <Input
              label="Confirmer le mot de passe"
              placeholder="Répétez votre mot de passe"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              icon="lock-closed-outline"
            />

            <Button
              onPress={handleSignup}
              loading={loading}
              fullWidth
              size="lg"
              style={{ marginTop: Spacing.md }}
            >
              Créer mon compte
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Se connecter</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
  keyboardView: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: "flex-start",
    flexDirection: "column",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["4xl"],
  },
  logoIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius["lg"],
    backgroundColor: Colors.rose[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: FontSizes["lg"],
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
  },
  header: {
    marginBottom: Spacing["3xl"],
  },
  title: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.neutral[500],
  },
  form: {
    marginBottom: Spacing["2xl"],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSizes.base,
    color: Colors.neutral[500],
  },
  footerLink: {
    fontSize: FontSizes.base,
    color: Colors.rose[600],
    fontWeight: FontWeights.bold,
  },
});
