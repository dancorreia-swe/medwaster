import { authClient } from "@/lib/auth-client";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import React, {
  useState,
  useCallback,
  forwardRef,
  useMemo,
  useImperativeHandle,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Eye, EyeOff, X } from "lucide-react-native";
import { GoogleIcon } from "./google-icon";

type AuthMode = "signin" | "signup";

interface AuthBottomSheetProps {
  onClose?: () => void;
}

export interface AuthBottomSheetRef {
  expand: () => void;
  close: () => void;
  switchToSignIn: () => void;
  switchToSignUp: () => void;
}

export const AuthBottomSheet = forwardRef<
  AuthBottomSheetRef,
  AuthBottomSheetProps
>(({ onClose }, ref) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const snapPoints = useMemo(() => ["90%"], []);

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand(),
    close: () => bottomSheetRef.current?.close(),
    switchToSignIn: () => setMode("signin"),
    switchToSignUp: () => setMode("signup"),
  }));

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
            ctx.error?.message ||
              (mode === "signup"
                ? "Falha ao cadastrar com Google"
                : "Falha ao entrar com Google"),
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

  const handleSignIn = async () => {
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

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    setIsLoading(true);

    await authClient.signUp.email(
      {
        name,
        email,
        password,
      },
      {
        onError: (ctx) => {
          Alert.alert("Erro", ctx.error?.message || "Falha ao criar conta");
          setIsLoading(false);
        },
        onSuccess: () => {
          setName("");
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

  const isSignIn = mode === "signin";

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: "#FFFFFF" }}
      handleIndicatorStyle={{ backgroundColor: "#E5E7EB" }}
    >
      <BottomSheetView style={{ flex: 1, paddingHorizontal: 20 }}>
        <View className="flex-row justify-between items-center py-3">
          <TouchableOpacity
            onPress={onClose}
            className="rounded-full justify-center items-center"
          >
            <X size={20} color="#4A5565" />
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isLoading}
            onPress={() => setMode(isSignIn ? "signup" : "signin")}
          >
            <Text className="text-sm font-medium text-[#155DFC] tracking-tight">
              {isSignIn ? "CADASTRAR" : "ENTRAR"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="mt-7">
          {/* Title */}
          <View className="mb-3">
            <Text className="text-3xl font-semibold text-[#0A0A0A] text-center tracking-tight">
              {isSignIn ? "Bem-vindo de volta" : "Crie sua conta"}
            </Text>
          </View>

          {/* Subtitle */}
          <View className="mb-7">
            <Text className="text-base font-normal text-[#4A5565] text-center tracking-tight">
              {isSignIn
                ? "Continue seu aprendizado sobre gestão de resíduos médicos"
                : "Junte-se a milhares de profissionais de saúde"}
            </Text>
          </View>

          {/* Name Input (Sign Up only) */}
          {!isSignIn && (
            <View className="mb-4">
              <TextInput
                className="bg-[#F9FAFB] border border-gray-200 rounded-[12.75px] px-4 py-4 text-base text-[#0A0A0A] tracking-tight"
                placeholder="Nome completo"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!isLoading}
              />
            </View>
          )}

          {/* Email Input */}
          <View className="mb-4">
            <TextInput
              className="bg-[#F9FAFB] border border-gray-200 rounded-[12.75px] px-4 py-4 text-base text-[#0A0A0A] tracking-tight"
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

          {/* Password Input */}
          <View className="mb-4 relative">
            <TextInput
              className="bg-[#F9FAFB] border border-gray-200 rounded-[12.75px] px-4 py-4 pr-12 text-base text-[#0A0A0A] tracking-tight"
              placeholder="Senha"
              placeholderTextColor="#6B7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete={isSignIn ? "password" : "password-new"}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2"
              style={{ transform: [{ translateY: -10 }] }}
            >
              {showPassword ? (
                <EyeOff size={20} color="#99A1AF" strokeWidth={1.46} />
              ) : (
                <Eye size={20} color="#99A1AF" strokeWidth={1.46} />
              )}
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={isSignIn ? handleSignIn : handleSignUp}
            disabled={isLoading}
            className={`bg-[#51A2FF] rounded-full py-4 items-center justify-center ${isSignIn ? "mb-5" : "mb-6"}`}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold tracking-tight">
                {isSignIn ? "ENTRAR" : "CRIAR CONTA"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password (Sign In only) */}
          {isSignIn && (
            <TouchableOpacity
              className="items-center mb-6"
              disabled={isLoading}
            >
              <Text className="text-sm font-semibold text-[#0A0A0A] tracking-tight">
                ESQUECEU A SENHA?
              </Text>
            </TouchableOpacity>
          )}

          {/* Divider with OR */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-[1.09px] bg-gray-200" />
            <View className="bg-white px-4">
              <Text className="text-sm font-medium text-[#6A7282]">OU</Text>
            </View>
            <View className="flex-1 h-[1.09px] bg-gray-200" />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            onPress={handleSocialLogin}
            disabled={isLoading}
            className="bg-white border border-gray-200 rounded-full py-4 items-center justify-center flex-row mb-4 gap-2"
          >
            <GoogleIcon size={16} />
            <Text className="text-[#0A0A0A] text-base font-medium tracking-tight">
              CONTINUAR COM GOOGLE
            </Text>
          </TouchableOpacity>

          {/* Privacy Note */}
          <View className="px-4 mb-6">
            <Text
              className="text-sm font-normal text-[#6A7282] text-center"
              style={{ lineHeight: 18 }}
            >
              Nunca compartilharemos seus dados sem sua permissão
            </Text>
          </View>

          <View className="pt-4 mb-2.5">
            <TouchableOpacity className="items-center" onPress={onClose}>
              <Text className="text-base font-normal text-[#4A5565] tracking-tight">
                Continuar sem conta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

AuthBottomSheet.displayName = "AuthBottomSheet";
