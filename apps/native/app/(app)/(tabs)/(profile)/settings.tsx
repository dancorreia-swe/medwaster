import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Container } from "@/components/container";
import { ProfilePictureUploader } from "@/features/profile/components/profile-picture-uploader";
import { ChangeEmailSheet } from "@/features/profile/components/change-email-sheet";
import { ChangePasswordSheet } from "@/features/profile/components/change-password-sheet";
import { DeleteAccountDialog } from "@/features/profile/components/delete-account-dialog";
import { AccountStatsCard } from "@/features/profile/components/account-stats-card";
import { useCallback, useEffect, useRef, useState } from "react";
import type BottomSheet from "@gorhom/bottom-sheet";
import { User, Mail, Lock, Trash2, Info, ChevronRight } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { client as api } from "@/lib/eden";
import { toast } from "sonner-native";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";

export default function SettingsScreen() {
  const { data: session, refetch: refetchSession } = authClient.useSession();
  const user = session?.user;
  const router = useRouter();

  const changeEmailSheetRef = useRef<BottomSheet>(null);
  const changePasswordSheetRef = useRef<BottomSheet>(null);
  const deleteAccountDialogRef = useRef<BottomSheet>(null);

  const [name, setName] = useState(user?.name || "");
  const [currentImage, setCurrentImage] = useState(user?.image || null);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [accountStats, setAccountStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const loadAccountStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const response = await api.profile.stats.account.get();
      if (response.data?.success) {
        setAccountStats(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load account stats:", error);
      toast.error("Não foi possível carregar suas informações");
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    loadAccountStats();
  }, [loadAccountStats]);

  useEffect(() => {
    setName(user?.name || "");
    setCurrentImage(user?.image || null);
  }, [user?.name, user?.image]);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error("O nome não pode ficar vazio");
      return;
    }

    if (name === user?.name) {
      return;
    }

    try {
      setIsUpdatingName(true);
      const response = await api.profile.patch({
        name: name.trim(),
      });

      if (response.data?.success) {
        await refetchSession();
        toast.success("Nome atualizado com sucesso!");
      } else {
        throw new Error("Não foi possível atualizar o nome");
      }
    } catch (error: any) {
      console.error("Erro ao atualizar nome:", error);
      toast.error(error.message || "Não foi possível atualizar o nome");
      setName(user?.name || "");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleImageUpdate = async (imageUrl: string) => {
    try {
      const response = await api.profile.patch({
        image: imageUrl,
      });

      if (response.data?.success) {
        setCurrentImage(imageUrl);
        await refetchSession();
      } else {
        throw new Error("Não foi possível atualizar a foto");
      }
    } catch (error: any) {
      console.error("Erro ao atualizar imagem:", error);
      toast.error(error.message || "Não foi possível atualizar a foto");
    }
  };

  const handleEmailChanged = async () => {
    await refetchSession();
    await loadAccountStats();
  };

  const handleAccountDeleted = async () => {
    router.replace("/sign-in");
  };

  return (
    <>
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <Text className="text-4xl font-bold text-gray-900 dark:text-gray-50">
              Configurações
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
              Gerencie sua conta e preferências
            </Text>
          </View>

          {/* Profile Picture */}
          <View className="px-6 py-6 dark:bg-gray-900 mb-4">
            <ProfilePictureUploader
              currentImage={currentImage}
              onImageUpdate={handleImageUpdate}
              size="lg"
            />
          </View>

          {/* Personal Information */}
          <View className="px-6 py-4 bg-white dark:bg-gray-900 mb-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-4">
              Informações pessoais
            </Text>

            {/* Name */}
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Nome completo
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
                  <Icon icon={User} size={20} className="text-white-400 mr-2" />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Digite seu nome completo"
                    className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50"
                    onBlur={handleUpdateName}
                  />
                </View>
                {isUpdatingName && <ActivityIndicator size="small" />}
              </View>
            </View>

            {/* Email */}
            <View>
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </Text>
              <TouchableOpacity
                onPress={() => changeEmailSheetRef.current?.snapToIndex(0)}
                className="flex-row items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-4"
              >
                <View className="flex-row items-center flex-1">
                  <Icon icon={Mail} size={20} className="text-gray-400 mr-2" />
                  <Text className="text-base text-gray-900 dark:text-gray-50 flex-1">
                    {user?.email}
                  </Text>
                </View>
                <Icon icon={ChevronRight} size={20} className="text-gray-400" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security */}
          {accountStats?.hasPassword && (
            <View className="px-6 py-4 bg-white dark:bg-gray-900 mb-4">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-4">
                Segurança
              </Text>

              <TouchableOpacity
                onPress={() => changePasswordSheetRef.current?.snapToIndex(0)}
                className="flex-row items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-4"
              >
                <View className="flex-row items-center flex-1">
                  <Icon icon={Lock} size={20} className="text-gray-400 mr-2" />
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-gray-50 font-medium">
                      Alterar senha
                    </Text>
                    <Text className="text-base text-gray-500 dark:text-gray-400 mt-0.5">
                      Atualize a senha da sua conta
                    </Text>
                  </View>
                </View>
                <Icon icon={ChevronRight} size={20} className="text-gray-400" />
              </TouchableOpacity>
            </View>
          )}

          {/* Account Information */}
          {isLoadingStats ? (
            <View className="px-6 py-8 items-center">
              <ActivityIndicator size="large" />
            </View>
          ) : accountStats ? (
            <View className="px-6 mb-4">
              <AccountStatsCard stats={accountStats} />
            </View>
          ) : null}

          {/* Danger Zone */}
          <View className="px-6 py-4 bg-white dark:bg-gray-900 mb-4">
            <Text className="text-lg font-bold text-red-600 dark:text-red-500 mb-2">
              Zona de risco
            </Text>
            <Text className="text-base text-gray-600 dark:text-gray-400 mb-4">
              Ações irreversíveis e destrutivas
            </Text>

            <TouchableOpacity
              onPress={() => deleteAccountDialogRef.current?.snapToIndex(0)}
              className="flex-row items-center justify-between bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg px-4 py-4"
            >
              <View className="flex-row items-center flex-1">
                <Icon icon={Trash2} size={20} className="text-red-600 dark:text-red-500 mr-3" />
                <View className="flex-1">
                  <Text className="text-red-600 dark:text-red-500 font-semibold">
                    Excluir conta
                  </Text>
                  <Text className="text-base text-red-500 dark:text-red-400 mt-0.5">
                    Excluir permanentemente sua conta e todos os dados
                  </Text>
                </View>
              </View>
              <Icon icon={ChevronRight} size={20} className="text-red-600 dark:text-red-500" />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View className="px-6 py-4">
            <View className="flex-row items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Icon icon={Info} size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              <Text className="flex-1 text-base text-blue-700 dark:text-blue-400">
                Seus dados são protegidos e criptografados. Alterações no perfil são aplicadas imediatamente.
              </Text>
            </View>
          </View>
        </ScrollView>
      </Container>

      {/* Bottom Sheets */}
      <ChangeEmailSheet
        ref={changeEmailSheetRef}
        currentEmail={user?.email || ""}
        onEmailChanged={handleEmailChanged}
      />
      <ChangePasswordSheet
        ref={changePasswordSheetRef}
        onPasswordChanged={() => toast.success("Senha alterada!")}
      />
      <DeleteAccountDialog
        ref={deleteAccountDialogRef}
        hasPassword={accountStats?.hasPassword || false}
        onAccountDeleted={handleAccountDeleted}
      />
    </>
  );
}
