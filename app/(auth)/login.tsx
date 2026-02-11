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
import { useAuthStore } from "@/stores/auth";
import { api } from "@/utils/api";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";
import type { LoginResponseDto } from "@/types";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const { toast, error: showError, hide: hideToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    console.log("[LOGIN] Attempting login with email:", email);

    try {
      const data = await api<LoginResponseDto>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        requiresAuth: false,
      });

      console.log(
        "[LOGIN] Success, received data:",
        JSON.stringify(data, null, 2),
      );
      await setAuth(data);
      console.log("[LOGIN] Auth set, navigating to app...");
      router.replace("/(app)");
    } catch (err: any) {
      console.error("[LOGIN] Error:", err);
      console.error("[LOGIN] Error message:", err.message);
      console.error("[LOGIN] Error status:", err.status);
      console.error("[LOGIN] Error data:", err.data);
      showError(err.message || "Erreur de connexion");
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
            <Text style={styles.title}>Bon retour !</Text>
            <Text style={styles.subtitle}>
              Connectez-vous pour accéder à vos recettes
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
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              icon="lock-closed-outline"
            />

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </Link>

            <Button onPress={handleLogin} loading={loading} fullWidth size="lg">
              Se connecter
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore de compte ?</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Créer un compte</Text>
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
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    justifyContent: "flex-start",
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: Spacing.xl,
    marginTop: -Spacing.sm,
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    color: Colors.rose[600],
    fontWeight: FontWeights.semibold,
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
