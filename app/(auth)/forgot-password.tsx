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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { toast, success: showSuccess, error: showError, hide: hideToast } = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      showError("Veuillez entrer votre email");
      return;
    }

    setLoading(true);

    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        requiresAuth: false,
      });

      setSent(true);
      showSuccess("Email envoyé ! Vérifiez votre boîte de réception.");
    } catch (err: any) {
      showError(err.message || "Erreur lors de l'envoi");
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
          {/* Back button */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={Colors.neutral[600]}
              />
            </TouchableOpacity>
          </Link>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <Ionicons
                name={sent ? "checkmark-circle" : "key"}
                size={48}
                color={sent ? Colors.success.main : Colors.rose[500]}
              />
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {sent ? "Email envoyé !" : "Mot de passe oublié ?"}
            </Text>
            <Text style={styles.subtitle}>
              {sent
                ? "Nous avons envoyé un lien de réinitialisation à votre adresse email."
                : "Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe."}
            </Text>
          </View>

          {!sent && (
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

              <Button
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                size="lg"
              >
                Envoyer le lien
              </Button>
            </View>
          )}

          {sent && (
            <View style={styles.form}>
              <Button
                onPress={() => router.replace("/(auth)/login")}
                fullWidth
                size="lg"
              >
                Retour à la connexion
              </Button>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => {
                  setSent(false);
                  setEmail("");
                }}
              >
                <Text style={styles.resendText}>
                  Vous n'avez pas reçu l'email ?
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["3xl"],
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.rose[100],
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    marginBottom: Spacing["3xl"],
    alignItems: "center",
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
    lineHeight: 22,
    maxWidth: 300,
  },
  form: {
    marginBottom: Spacing["2xl"],
  },
  resendButton: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  resendText: {
    fontSize: FontSizes.base,
    color: Colors.rose[600],
    fontWeight: FontWeights.semibold,
  },
});
