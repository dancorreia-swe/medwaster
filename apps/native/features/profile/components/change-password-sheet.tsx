import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { X, Lock, Eye, EyeOff } from "lucide-react-native";
import { Icon } from "@/components/icon";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { useCallback, useMemo, forwardRef, type Ref, useState } from "react";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import { useColorScheme } from "@/lib/use-color-scheme";
import { api } from "@/lib/eden";
import { toast } from "sonner-native";

interface ChangePasswordSheetProps {
  onPasswordChanged: () => void;
}

const ChangePasswordSheetComponent = (
  { onPasswordChanged }: ChangePasswordSheetProps,
  ref: Ref<BottomSheet>,
) => {
  const snapPoints = useMemo(() => ["80%"], []);
  const { isDarkColorScheme } = useColorScheme();
  const sheetBackground = isDarkColorScheme ? "#0f172a" : "#ffffff";
  const indicatorColor = isDarkColorScheme ? "#374151" : "#d1d5db";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const closeSheet = () => {
    if (ref && typeof ref !== "function" && ref.current) {
      ref.current.close();
      // Reset state after animation
      setTimeout(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowCurrent(false);
        setShowNew(false);
        setShowConfirm(false);
      }, 300);
    }
  };

  const validatePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return false;
    }

    if (newPassword.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem");
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    try {
      setIsLoading(true);
      const response = await api.profile.password.change.post({
        currentPassword,
        newPassword,
      });

      if (response.data?.success) {
        toast.success("Senha alterada com sucesso!");
        onPasswordChanged();
        closeSheet();
      } else {
        throw new Error("Não foi possível alterar a senha");
      }
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.message || "Não foi possível alterar a senha");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: sheetBackground }}
      handleIndicatorStyle={{ backgroundColor: indicatorColor }}
    >
      <BottomSheetView style={{ flex: 1, backgroundColor: sheetBackground }}>
        {/* Header */}
        <View className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-gray-900 dark:text-gray-50">
                Alterar senha
              </Text>
              <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
                Atualize a senha da sua conta
              </Text>
            </View>

            <TouchableOpacity
              onPress={closeSheet}
              className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
            >
              <Icon icon={X} size={20} className="text-gray-600 dark:text-gray-400" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-6">
          <Text className="text-base text-gray-600 dark:text-gray-400 mb-6">
            Escolha uma senha forte com pelo menos 8 caracteres, incluindo números e caracteres especiais.
          </Text>

          {/* Current Password */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Senha atual
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
              <Icon icon={Lock} size={20} className="text-gray-400 mr-2" />
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Digite a senha atual"
                placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                secureTextEntry={!showCurrent}
                autoComplete="password"
                className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50"
              />
              <TouchableOpacity
                onPress={() => setShowCurrent(!showCurrent)}
                className="p-2"
              >
                <Icon
                  icon={showCurrent ? EyeOff : Eye}
                  size={20}
                  className="text-gray-400"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Nova senha
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
              <Icon icon={Lock} size={20} className="text-gray-400 mr-2" />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite a nova senha (mín. 8 caracteres)"
                placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                secureTextEntry={!showNew}
                autoComplete="password-new"
                className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50"
              />
              <TouchableOpacity
                onPress={() => setShowNew(!showNew)}
                className="p-2"
              >
                <Icon
                  icon={showNew ? EyeOff : Eye}
                  size={20}
                  className="text-gray-400"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Confirmar nova senha
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
              <Icon icon={Lock} size={20} className="text-gray-400 mr-2" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repita a nova senha"
                placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                secureTextEntry={!showConfirm}
                autoComplete="password-new"
                className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50"
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                className="p-2"
              >
                <Icon
                  icon={showConfirm ? EyeOff : Eye}
                  size={20}
                  className="text-gray-400"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Requirements */}
          <View className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <Text className="text-base text-blue-700 dark:text-blue-400 mb-1">
              Requisitos de senha:
            </Text>
            <Text className="text-base text-blue-600 dark:text-blue-500">
              • Pelo menos 8 caracteres
            </Text>
            <Text className="text-base text-blue-600 dark:text-blue-500">
              • Misture letras, números e caracteres especiais
            </Text>
          </View>

          {/* Change Button */}
          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={isLoading}
            className="bg-blue-500 dark:bg-blue-600 rounded-lg py-4 items-center active:opacity-80"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Alterar senha
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export const ChangePasswordSheet = forwardRef(ChangePasswordSheetComponent);

ChangePasswordSheet.displayName = "ChangePasswordSheet";
