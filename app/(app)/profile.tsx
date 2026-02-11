import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "@/stores/auth";
import { profileApi } from "@/utils/api";
import { Card } from "@/components/ui";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from "@/constants/theme";

const SOCIAL_FIELDS = [
  {
    key: "location",
    label: "Localisation",
    icon: "location-outline",
    placeholder: "Paris, France",
  },
  {
    key: "website",
    label: "Site Web",
    icon: "globe-outline",
    placeholder: "https://...",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: "logo-instagram",
    placeholder: "@pseudo",
  },
  {
    key: "tiktok",
    label: "TikTok",
    icon: "musical-notes-outline",
    placeholder: "@pseudo",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: "logo-youtube",
    placeholder: "Lien chaîne",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    icon: "logo-pinterest",
    placeholder: "Utilisateur",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: "logo-facebook",
    placeholder: "@pseudo",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    icon: "logo-twitter",
    placeholder: "@pseudo",
  },
  {
    key: "twitch",
    label: "Twitch",
    icon: "logo-twitch",
    placeholder: "@pseudo",
  },
] as const;

type SocialKey =
  | "location"
  | "website"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "pinterest"
  | "facebook"
  | "twitter"
  | "twitch";
type SocialLinks = Record<SocialKey, string>;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const {
    toast,
    error: showError,
    success: showSuccess,
    hide: hideToast,
  } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile fields
  const [publicName, setPublicName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);

  // Social links
  const [links, setLinks] = useState<SocialLinks>({
    location: "",
    website: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    pinterest: "",
    facebook: "",
    twitter: "",
    twitch: "",
  });

  const loadProfile = useCallback(async () => {
    try {
      const data = await profileApi.getMe();
      if (data) {
        setUsername(user?.username || "");
        setPublicName(data.profile?.name || "");
        setBio(data.profile?.bio || "");
        setIsPublic(data.profile?.isPublic || false);
        setAvatarUrl(data.profile?.avatar_url || null);
        setLinks({
          location: data.profile?.location || "",
          website: data.profile?.website || "",
          instagram: data.profile?.instagram || "",
          tiktok: data.profile?.tiktok || "",
          youtube: data.profile?.youtube || "",
          pinterest: data.profile?.pinterest || "",
          facebook: data.profile?.facebook || "",
          twitter: data.profile?.twitter || "",
          twitch: data.profile?.twitch || "",
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      showError("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", username.trim());
      formData.append("public_name", publicName.trim());
      formData.append("bio", bio.trim());
      formData.append("isPublic", String(isPublic));

      Object.entries(links).forEach(([key, value]) => {
        formData.append(key, value.trim());
      });

      if (newAvatarUri) {
        formData.append("avatar", {
          uri: newAvatarUri,
          type: "image/jpeg",
          name: "avatar.jpg",
        } as any);
      }

      await profileApi.update(formData);
      updateUser({ username: username.trim() });
      showSuccess("Profil mis à jour !");
    } catch (err: any) {
      showError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const copyProfileUrl = async () => {
    const url = `https://moncarnetderecettes.vercel.app/u/${user?.username}`;
    await Clipboard.setStringAsync(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAvatar = newAvatarUri || avatarUrl;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.spinner} />
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Mon profil</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={copyProfileUrl}
          >
            <Ionicons
              name={copied ? "checkmark" : "share-outline"}
              size={28}
              color={copied ? Colors.success.main : Colors.neutral[900]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.rose[500]} />
            ) : (
              <Ionicons
                name="checkmark"
                size={28}
                color={Colors.neutral[900]}
              />
            )}
          </TouchableOpacity>
        </View>
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
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
              <View style={styles.avatarWrapper}>
                {displayAvatar ? (
                  <Image
                    source={{ uri: displayAvatar }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {publicName?.charAt(0) ||
                        user?.username?.charAt(0) ||
                        "U"}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color="white" />
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage}>
              <Text style={styles.avatarEditLink}>Modifier la photo</Text>
            </TouchableOpacity>
          </View>

          {/* Main Info Card */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>À propos de vous</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom d'affichage</Text>
              <TextInput
                style={styles.input}
                value={publicName}
                onChangeText={setPublicName}
                placeholder="Prénom"
                placeholderTextColor={Colors.neutral[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Parlez-nous de vous..."
                placeholderTextColor={Colors.neutral[400]}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="pseudo"
                placeholderTextColor={Colors.neutral[400]}
                autoCapitalize="none"
              />
            </View>

            {/* Visibility Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Profil public</Text>
                <Text style={styles.toggleSubtitle}>
                  {isPublic
                    ? "Tout le monde peut voir votre profil."
                    : "Seuls vous pouvez voir ce profil."}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: Colors.neutral[200],
                  true: Colors.rose[500],
                }}
                thumbColor={Colors.white}
              />
            </View>
          </Card>

          {/* Social Links Card */}
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Vos liens</Text>
            <Text style={styles.sectionSubtitle}>
              Ajoutez vos réseaux pour partager votre univers.
            </Text>

            <View style={styles.socialList}>
              {SOCIAL_FIELDS.map((field) => (
                <View key={field.key} style={styles.socialRow}>
                  <View style={styles.socialIconCircle}>
                    <Ionicons
                      name={field.icon as any}
                      size={18}
                      color={Colors.rose[600]}
                    />
                  </View>
                  <View style={styles.socialInputContainer}>
                    <Text style={styles.socialLabel}>{field.label}</Text>
                    <TextInput
                      style={styles.socialInput}
                      value={links[field.key as SocialKey]}
                      onChangeText={(text) =>
                        setLinks((prev) => ({ ...prev, [field.key]: text }))
                      }
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.neutral[400]}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },

  // Avatar
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.rose[500],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.neutral[900],
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarEditLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.rose[600],
  },

  // Section cards
  sectionCard: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.black,
    color: Colors.neutral[900],
    marginBottom: Spacing.lg,
  },
  sectionSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
    marginTop: -Spacing.sm,
    marginBottom: Spacing.xl,
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
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  toggleTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  toggleTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.neutral[500],
  },

  // Social Links
  socialList: {
    gap: Spacing.lg,
  },
  socialRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  socialIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.rose[50],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  socialInputContainer: {
    flex: 1,
  },
  socialLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  socialInput: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.neutral[900],
  },
});
