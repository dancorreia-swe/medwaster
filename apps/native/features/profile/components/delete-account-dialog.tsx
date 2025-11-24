import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { X, AlertTriangle, Lock } from "lucide-react-native";
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

interface DeleteAccountDialogProps {
  hasPassword: boolean;
  onAccountDeleted: () => void;
}

const DeleteAccountDialogComponent = (
  { hasPassword, onAccountDeleted }: DeleteAccountDialogProps,
  ref: Ref<BottomSheet>,
) => {
  const snapPoints = useMemo(() => ["75%"], []);
  const { isDarkColorScheme } = useColorScheme();
  const sheetBackground = isDarkColorScheme ? "#0f172a" : "#ffffff";
  const indicatorColor = isDarkColorScheme ? "#374151" : "#d1d5db";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
      />
    ),
    [],
  );

  const closeSheet = () => {
    if (ref && typeof ref !== "function" && ref.current) {
      ref.current.close();
      // Reset state after animation
      setTimeout(() => {
        setPassword("");
        setConfirmation("");
      }, 300);
    }
  };

  const handleDeleteAccount = async () => {
    if (hasPassword && !password) {
      toast.error("Senha obrigatória", {
        description: "Digite sua senha para confirmar a exclusão",
      });
      return;
    }

    if (confirmation !== "EXCLUIR MINHA CONTA") {
      toast.error("Confirmação incorreta", {
        description: 'Digite exatamente "EXCLUIR MINHA CONTA"',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.profile.delete({
        password: password || "not-required",
        confirmation,
      });

      if (response.data?.success) {
        toast.success("Conta excluída", {
          description: "Sua conta foi excluída permanentemente",
        });
        onAccountDeleted();
        closeSheet();
      } else {
        throw new Error("Não foi possível excluir a conta");
      }
    } catch (error: any) {
      console.error("Erro ao excluir conta:", error);
      toast.error(error.message || "Não foi possível excluir a conta");
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
        <View className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center">
                <Icon icon={AlertTriangle} size={20} className="text-red-600 dark:text-red-500" />
              </View>
              <View>
                <Text className="text-xl font-bold text-red-900 dark:text-red-50">
                  Excluir conta
                </Text>
                <Text className="text-base text-red-700 dark:text-red-400 mt-0.5">
                  Esta ação é permanente
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={closeSheet}
              className="w-10 h-10 rounded-full items-center justify-center bg-red-100 dark:bg-red-900/30"
            >
              <Icon icon={X} size={20} className="text-red-600 dark:text-red-500" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-6">
          {/* Warning Section */}
          <View className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
            <Text className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
              Atenção: esta ação não pode ser desfeita
            </Text>
            <Text className="text-base text-red-700 dark:text-red-400 mb-1">
              • Todos os seus dados serão excluídos permanentemente
            </Text>
            <Text className="text-base text-red-700 dark:text-red-400 mb-1">
              • Seu progresso em cursos será perdido
            </Text>
            <Text className="text-base text-red-700 dark:text-red-400 mb-1">
              • Suas conquistas e certificados serão removidos
            </Text>
            <Text className="text-base text-red-700 dark:text-red-400">
              • Não será possível recuperar sua conta
            </Text>
          </View>

          <Text className="text-base text-gray-600 dark:text-gray-400 mb-6">
            Se tiver certeza de que deseja excluir sua conta, confirme abaixo:
          </Text>

          {/* Password Input (only if user has password) */}
          {hasPassword && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Digite sua senha
              </Text>
              <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
                <Icon icon={Lock} size={20} className="text-gray-400 mr-2" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Digite sua senha"
                  placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                  secureTextEntry
                  autoComplete="password"
                  className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50"
                />
              </View>
            </View>
          )}

          {/* Confirmation Text */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Digite "EXCLUIR MINHA CONTA" para confirmar
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
              <TextInput
                value={confirmation}
                onChangeText={setConfirmation}
                placeholder="EXCLUIR MINHA CONTA"
                placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                autoCapitalize="characters"
                className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50"
              />
            </View>
            <Text className="text-base text-gray-500 dark:text-gray-400 mt-2">
              Digite exatamente: EXCLUIR MINHA CONTA
            </Text>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isLoading}
            className="bg-red-600 dark:bg-red-700 rounded-lg py-4 items-center mb-3 active:opacity-80"
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Excluir minha conta permanentemente
              </Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={closeSheet}
            disabled={isLoading}
            className="py-3 items-center active:opacity-80"
          >
            <Text className="text-gray-600 dark:text-gray-400 font-medium">
              Cancelar e manter minha conta
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export const DeleteAccountDialog = forwardRef(DeleteAccountDialogComponent);

DeleteAccountDialog.displayName = "DeleteAccountDialog";
