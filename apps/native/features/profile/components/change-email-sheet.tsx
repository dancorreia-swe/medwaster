import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { X, Mail, Lock, Check } from "lucide-react-native";
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

interface ChangeEmailSheetProps {
  currentEmail: string;
  onEmailChanged: () => void;
}

const ChangeEmailSheetComponent = (
  { currentEmail, onEmailChanged }: ChangeEmailSheetProps,
  ref: Ref<BottomSheet>,
) => {
  const snapPoints = useMemo(() => ["70%"], []);
  const { isDarkColorScheme } = useColorScheme();
  const sheetBackground = isDarkColorScheme ? "#0f172a" : "#ffffff";
  const indicatorColor = isDarkColorScheme ? "#374151" : "#d1d5db";

  const [step, setStep] = useState<"request" | "verify">("request");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        setStep("request");
        setNewEmail("");
        setPassword("");
        setVerificationCode("");
      }, 300);
    }
  };

  const handleRequestChange = async () => {
    if (!newEmail || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.profile["email"]["request-change"].post({
        newEmail,
        password,
      });

      if (response.data?.success) {
        setStep("verify");
        toast.success("Código enviado!", {
          description: `Confira seu email em ${newEmail}`,
        });
      } else {
        throw new Error("Não foi possível enviar o código");
      }
    } catch (error: any) {
      console.error("Erro ao solicitar troca de email:", error);
      toast.error(error.message || "Não foi possível solicitar a troca de email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyChange = async () => {
    if (!verificationCode) {
      toast.error("Digite o código de verificação");
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.profile["email"]["verify-change"].post({
        token: verificationCode,
      });

      if (response.data?.success) {
        toast.success("Email alterado com sucesso!");
        onEmailChanged();
        closeSheet();
      } else {
        throw new Error("Código de verificação inválido");
      }
    } catch (error: any) {
      console.error("Erro ao verificar email:", error);
      toast.error(error.message || "Não foi possível verificar o email");
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
                {step === "request" ? "Alterar email" : "Verificar novo email"}
              </Text>
              <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
                {step === "request"
                  ? `Atual: ${currentEmail}`
                  : `Código enviado para ${newEmail}`}
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
          {step === "request" ? (
            <>
              <Text className="text-base text-gray-600 dark:text-gray-400 mb-6">
                Digite seu novo email e a senha atual para solicitar a troca.
                Enviaremos um código de verificação para o novo endereço.
              </Text>

              {/* New Email Input */}
              <View className="mb-4">
                <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Novo email
                </Text>
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
                  <Icon icon={Mail} size={20} className="text-gray-400 mr-2" />
                  <TextInput
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="novo.email@exemplo.com"
                    placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Senha atual
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

              {/* Request Button */}
              <TouchableOpacity
                onPress={handleRequestChange}
                disabled={isLoading}
                className="bg-blue-500 dark:bg-blue-600 rounded-lg py-4 items-center active:opacity-80"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Enviar código de verificação
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-base text-gray-600 dark:text-gray-400 mb-6">
                Enviamos um código de verificação para o novo email.
                Digite-o abaixo para concluir a troca.
              </Text>

              {/* Verification Code Input */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Código de verificação
                </Text>
                <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-4">
                  <Icon icon={Check} size={20} className="text-gray-400 mr-2" />
                  <TextInput
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    placeholder="Digite o código"
                    placeholderTextColor={isDarkColorScheme ? "#9ca3af" : "#6b7280"}
                    autoCapitalize="none"
                    className="flex-1 py-4 text-base text-gray-900 dark:text-gray-50 tracking-wider"
                  />
                </View>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={handleVerifyChange}
                disabled={isLoading}
                className="bg-blue-500 dark:bg-blue-600 rounded-lg py-4 items-center mb-3 active:opacity-80"
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Verificar e alterar email
                  </Text>
                )}
              </TouchableOpacity>

              {/* Back Button */}
              <TouchableOpacity
                onPress={() => setStep("request")}
                disabled={isLoading}
                className="py-3 items-center active:opacity-80"
              >
                <Text className="text-blue-500 dark:text-blue-400 font-medium">
                  Voltar para alterar email
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
};

export const ChangeEmailSheet = forwardRef(ChangeEmailSheetComponent);

ChangeEmailSheet.displayName = "ChangeEmailSheet";
