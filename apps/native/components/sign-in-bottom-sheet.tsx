import { authClient } from "@/lib/auth-client";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useState, useCallback, forwardRef, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Eye, EyeOff, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { GoogleIcon } from "./google-icon";

interface SignInBottomSheetProps {
  onClose?: () => void;
}

export const SignInBottomSheet = forwardRef<
  BottomSheet,
  SignInBottomSheetProps
>(({ onClose }, ref) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const snapPoints = useMemo(() => ["90%"], []);

  const handleNavigateToSignUp = useCallback(() => {
    onClose?.();
    router.push("/(auth)/sign-up");
  }, [onClose, router]);

  const handleSocialLogin = async () => {
    setIsLoading(true);

    await authClient.signIn.social(
      {
        provider: "google",
        callbackURL: "/(app)",
      },
      {
        onError: (ctx) => {
          Alert.alert(
            "Erro",
            ctx.error?.message || "Falha ao entrar com Google",
          );
          setIsLoading(false);
        },
        onSuccess: () => {
          setIsLoading(false);
          onClose?.();
        },
      },
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha email e senha");
      return;
    }

    setIsLoading(true);

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onError: (ctx) => {
          Alert.alert("Erro", ctx.error?.message || "Falha ao entrar");
          setIsLoading(false);
        },
        onSuccess: () => {
          setEmail("");
          setPassword("");
          onClose?.();
        },
        onFinished: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: "#E5E7EB" }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 21 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 20,
            borderBottomWidth: 0,
            borderBottomColor: "#F3F4F6",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 31.47,
              height: 31.47,
              borderRadius: 9999,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <X size={24} color="#4A5565" />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isLoading}
            onPress={handleNavigateToSignUp}
          >
            <Text className="text-sm font-medium text-[#155DFC] tracking-tight">
              CADASTRAR
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="mt-4">
          {/* Title */}
          <View className="mb-3">
            <Text className="text-3xl font-semibold text-zinc-800 text-center tracking-tight">
              Bem-vindo de volta
            </Text>
          </View>

          {/* Subtitle */}
          <View className="mb-8 px-4">
            <Text className="text-md text-zinc-600 text-center tracking-tight">
              Continue seu aprendizado sobre gestão de resíduos médicos
            </Text>
          </View>

          {/* Email Input */}
          <View style={{ marginBottom: 14 }}>
            <TextInput
              style={{
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12.75,
                paddingHorizontal: 10.5,
                paddingVertical: 15,
                fontSize: 14,
                color: "#0A0A0A",
                letterSpacing: -0.15,
              }}
              placeholder="Email ou usuário"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View style={{ marginBottom: 14, position: "relative" }}>
            <TextInput
              style={{
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 12.75,
                paddingHorizontal: 10.5,
                paddingVertical: 15,
                paddingRight: 42,
                fontSize: 14,
                color: "#0A0A0A",
                letterSpacing: -0.15,
              }}
              placeholder="Senha"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 15.75,
                top: "50%",
                transform: [{ translateY: -8.74 }],
              }}
            >
              {showPassword ? (
                <EyeOff size={17.48} color="#99A1AF" strokeWidth={1.46} />
              ) : (
                <Eye size={17.48} color="#99A1AF" strokeWidth={1.46} />
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-[#51A2FF] rounded-full py-4 flex-row items-center justify-center mb-6"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "500",
                  letterSpacing: -0.15,
                }}
              >
                ENTRAR
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={{ alignItems: "center", marginBottom: 24 }}
            disabled={isLoading}
          >
            <Text
              style={{
                fontSize: 12.25,
                fontWeight: "600",
                color: "#0A0A0A",
                letterSpacing: -0.018,
              }}
            >
              ESQUECEU A SENHA?
            </Text>
          </TouchableOpacity>

          {/* Divider with OR */}
          <View className="mb-6 flex-row items-center">
            <View
              style={{ flex: 1, height: 1.09, backgroundColor: "#E5E7EB" }}
            />
            <View
              style={{
                backgroundColor: "#FFFFFF",
                paddingHorizontal: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 12.25,
                  fontWeight: "500",
                  color: "#6A7282",
                  letterSpacing: 0.0088,
                }}
              >
                ou
              </Text>
            </View>
            <View
              style={{ flex: 1, height: 1.09, backgroundColor: "#E5E7EB" }}
            />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            onPress={handleSocialLogin}
            disabled={isLoading}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 9999,
              paddingVertical: 14.16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              marginBottom: 14,
              gap: 8,
            }}
          >
            <GoogleIcon size={13.99} />
            <Text
              style={{
                color: "#0A0A0A",
                fontSize: 14,
                fontWeight: "500",
                letterSpacing: -0.15,
              }}
            >
              CONTINUAR COM GOOGLE
            </Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <View style={{ paddingHorizontal: 14, marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: "400",
                color: "#6A7282",
                textAlign: "center",
                letterSpacing: 0.0092,
                lineHeight: 14,
              }}
            >
              Nunca compartilharemos seus dados sem sua permissão
            </Text>
          </View>

          {/* Continue without account */}
          <TouchableOpacity style={{ alignItems: "center" }} onPress={onClose}>
            <Text
              style={{
                fontSize: 12.25,
                fontWeight: "400",
                color: "#4A5565",
                letterSpacing: -0.018,
              }}
            >
              Continuar sem conta
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

SignInBottomSheet.displayName = "SignInBottomSheet";
