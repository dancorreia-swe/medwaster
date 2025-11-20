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
  useEffect,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Eye, EyeOff, MailCheck, X } from "lucide-react-native";
import { GoogleIcon } from "./google-icon";
import {
  BUTTON_HEIGHT,
  BUTTON_TEXT_SIZE,
  SECONDARY_BUTTON_HEIGHT,
  SECONDARY_BUTTON_TEXT_SIZE,
} from "./styles/buttons";
import { useColorScheme } from "@/lib/use-color-scheme";

type AuthMode = "signin" | "signup" | "forgot-password";

const PASSWORD_RESET_REDIRECT =
  process.env.EXPO_PUBLIC_PASSWORD_RESET_URL ??
  `${process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:3001"}/reset-password`;

const PASSWORD_RESET_COOLDOWN_MS = 30_000;

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSentTo, setForgotSentTo] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotCooldownEndsAt, setForgotCooldownEndsAt] = useState<number | null>(
    null,
  );
  const [cooldownTick, setCooldownTick] = useState(() => Date.now());
  const { isDarkColorScheme } = useColorScheme();

  const snapPoints = useMemo(() => ["90%"], []);
  const sheetBackground = isDarkColorScheme ? "#0f172a" : "#ffffff";
  const indicatorColor = isDarkColorScheme ? "#1f2937" : "#e5e7eb";

  const resetForgotState = () => {
    setForgotEmail("");
    setForgotSentTo("");
    setIsForgotLoading(false);
    setForgotError(null);
    setForgotCooldownEndsAt(null);
    setCooldownTick(Date.now());
  };

  useEffect(() => {
    if (!forgotCooldownEndsAt) return;
    const interval = setInterval(() => setCooldownTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [forgotCooldownEndsAt]);

  useImperativeHandle(ref, () => ({
    expand: () => bottomSheetRef.current?.expand(),
    close: () => {
      resetForgotState();
      setMode("signin");
      bottomSheetRef.current?.close();
    },
    switchToSignIn: () => {
      resetForgotState();
      setMode("signin");
    },
    switchToSignUp: () => {
      resetForgotState();
      setMode("signup");
    },
  }));

  const handleSocialLogin = async () => {
    // keep sheet visible and announce loading for accessibility
    setIsGoogleLoading(true);

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
          setIsGoogleLoading(false);
        },
        onSuccess: () => {
          setIsGoogleLoading(false);
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
  const isForgotPassword = mode === "forgot-password";

  const handleRequestClose = () => {
    resetForgotState();
    setMode("signin");
    onClose?.();
  };

  const handleForgotPasswordPress = () => {
    setForgotEmail(email);
    setMode("forgot-password");
  };

  const handleForgotPasswordSubmit = async () => {
    const targetEmail = forgotEmail.trim();

    setForgotError(null);

    if (!targetEmail) {
      setForgotError("Informe o email cadastrado");
      return;
    }

    setIsForgotLoading(true);

    try {
      await authClient.requestPasswordReset({
        email: targetEmail,
        redirectTo: PASSWORD_RESET_REDIRECT,
      });

      setForgotSentTo(targetEmail);
      setForgotEmail(targetEmail);
      setForgotCooldownEndsAt(Date.now() + PASSWORD_RESET_COOLDOWN_MS);
      Alert.alert(
        "Verifique seu email",
        "Se encontrarmos uma conta para esse endereço enviaremos um link em instantes.",
      );
    } catch (error: any) {
      setForgotError(error?.message || "Não foi possível enviar o email");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const headerActionLabel = isForgotPassword
    ? "Voltar"
    : isSignIn
      ? "Cadastrar"
      : "Entrar";

  const cooldownRemainingMs = forgotCooldownEndsAt
    ? Math.max(0, forgotCooldownEndsAt - cooldownTick)
    : 0;
  const isForgotCooldown = cooldownRemainingMs > 0;
  const cooldownSeconds = Math.ceil(cooldownRemainingMs / 1000);

  const handleHeaderAction = () => {
    if (isForgotPassword) {
      resetForgotState();
      setMode("signin");
      return;
    }

    setMode(isSignIn ? "signup" : "signin");
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: sheetBackground }}
      handleIndicatorStyle={{ backgroundColor: indicatorColor }}
    >
      <BottomSheetView
        style={{
          flex: 1,
          paddingHorizontal: 20,
          backgroundColor: sheetBackground,
        }}
        accessible
      >
        <View className="flex-row justify-between items-center py-3" accessible accessibilityRole="header">
          <Pressable
            onPress={handleRequestClose}
            accessibilityLabel="Fechar folha de login"
            accessibilityHint="Fecha e retorna à tela anterior"
            className="rounded-full justify-center items-center"
            hitSlop={12}
          >
            <X size={20} color="#94A3B8" />
          </Pressable>
          <Pressable
            disabled={isLoading || isGoogleLoading || isForgotLoading}
            onPress={handleHeaderAction}
            accessibilityRole="button"
            accessibilityLabel={
              isForgotPassword
                ? "Voltar para login"
                : isSignIn
                  ? "Ir para cadastro"
                  : "Ir para login"
            }
            hitSlop={12}
          >
            <Text className="text-[16.5px] font-semibold text-primary tracking-tight">
              {headerActionLabel}
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View className="mt-7">
          {isForgotPassword ? (
            <>
              <View className="mb-3" accessible accessibilityRole="header">
                <Text className="text-3xl font-semibold text-gray-900 dark:text-gray-50 text-center tracking-tight">
                  Recuperar acesso
                </Text>
              </View>

              <View className="mb-6 items-center px-2" accessible accessibilityRole="text">
                <Text className="text-[16px] text-muted-foreground dark:text-gray-300 text-center leading-6">
                  Informe o email cadastrado para enviarmos um link seguro de
                  redefinição de senha.
                </Text>
              </View>

              <View className="mb-4">
                <TextInput
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12.75px] px-4 py-4 text-base text-gray-900 dark:text-gray-100 tracking-tight"
                  style={{ minHeight: 52, fontSize: 16, lineHeight: 22 }}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#9CA3AF"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isForgotLoading}
                  accessibilityLabel="Email cadastrado"
                  accessibilityHint="Digite o email que você usa para entrar"
                />
                {forgotError && (
                  <Text className="text-sm text-red-500 mt-2">
                    {forgotError}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleForgotPasswordSubmit}
                disabled={isForgotLoading || isForgotCooldown}
                className="bg-primary rounded-full py-4 items-center justify-center mb-5"
                style={{ minHeight: BUTTON_HEIGHT, paddingVertical: 14 }}
                accessibilityRole="button"
                accessibilityLabel="Enviar email de redefinição"
                accessibilityState={{
                  busy: isForgotLoading,
                  disabled: isForgotCooldown,
                }}
              >
                {isForgotLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-[17px] font-semibold tracking-tight">
                    {isForgotCooldown
                      ? `Aguarde ${cooldownSeconds}s`
                      : forgotSentTo
                        ? "Reenviar link"
                        : "Enviar link"}
                  </Text>
                )}
              </TouchableOpacity>

              {forgotSentTo ? (
                <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-[16px] px-4 py-3 mb-5 items-center">
                  <MailCheck size={22} color="#1D4ED8" />
                  <Text className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-2">
                    Verifique sua caixa de entrada
                  </Text>
                  <Text className="text-sm text-muted-foreground dark:text-gray-300 text-center mt-1 leading-5">
                    Enviamos o link para {forgotSentTo}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                className="items-center"
                onPress={() => {
                  resetForgotState();
                  setMode("signin");
                }}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Voltar para tela de login"
              >
                <Text className="text-[15.5px] font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
                  Voltar para o login
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="mb-3" accessible accessibilityRole="header">
                <Text className="text-3xl font-semibold text-gray-900 dark:text-gray-50 text-center tracking-tight">
                  {isSignIn ? "Bem-vindo de volta" : "Crie sua conta"}
                </Text>
              </View>

              <View className="mb-7" accessible accessibilityRole="text">
                <Text className="text-[16.5px] font-normal text-muted-foreground dark:text-gray-300 text-center tracking-tight">
                  {isSignIn
                    ? "Continue seu aprendizado sobre gestão de resíduos médicos"
                    : "Junte-se a milhares de profissionais de saúde"}
                </Text>
              </View>

              {!isSignIn && (
                <View className="mb-4">
                  <TextInput
                    className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12.75px] px-4 py-4 text-base text-gray-900 dark:text-gray-100 tracking-tight"
                    style={{ minHeight: 52, fontSize: 16, lineHeight: 22 }}
                    placeholder="Nome completo"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoComplete="name"
                    editable={!isLoading && !isGoogleLoading}
                    accessibilityLabel="Nome completo"
                    accessibilityHint="Digite seu nome completo para criar a conta"
                  />
                </View>
              )}

              <View className="mb-4">
                <TextInput
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12.75px] px-4 py-4 text-base text-gray-900 dark:text-gray-100 tracking-tight"
                  style={{ minHeight: 52, fontSize: 16, lineHeight: 22 }}
                  placeholder="Email ou usuário"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading && !isGoogleLoading}
                  accessibilityLabel="Email ou usuário"
                  accessibilityHint="Digite seu email para entrar ou cadastrar"
                />
              </View>

              <View className="mb-4 relative">
                <TextInput
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[12.75px] px-4 py-4 pr-12 text-base text-gray-900 dark:text-gray-100 tracking-tight"
                  style={{ minHeight: 52, fontSize: 16, lineHeight: 22 }}
                  placeholder="Senha"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoComplete={isSignIn ? "password" : "password-new"}
                  editable={!isLoading && !isGoogleLoading}
                  accessibilityLabel="Senha"
                  accessibilityHint="Digite sua senha"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2"
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  style={{ transform: [{ translateY: -10 }] }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#94A3B8" strokeWidth={1.46} />
                  ) : (
                    <Eye size={20} color="#94A3B8" strokeWidth={1.46} />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={isSignIn ? handleSignIn : handleSignUp}
                disabled={isLoading || isGoogleLoading}
                className={`bg-primary rounded-full py-4 items-center justify-center ${isSignIn ? "mb-5" : "mb-6"}`}
                style={{ minHeight: BUTTON_HEIGHT, paddingVertical: 14 }}
                accessibilityRole="button"
                accessibilityLabel={isSignIn ? "Entrar com email e senha" : "Criar conta com email e senha"}
                accessibilityState={{ busy: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-[17px] font-semibold tracking-tight">
                    {isSignIn ? "Entrar" : "Criar conta"}
                  </Text>
                )}
              </TouchableOpacity>

              {isSignIn && (
                <TouchableOpacity
                  className="items-center mb-6"
                  disabled={isLoading}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Esqueceu a senha"
                  accessibilityHint="Toque para recuperar ou redefinir sua senha"
                  onPress={handleForgotPasswordPress}
                >
                  <Text className="text-[15.5px] font-semibold text-gray-900 dark:text-gray-50 tracking-tight">
                    Esqueceu a senha?
                  </Text>
                </TouchableOpacity>
              )}

              <View className="flex-row items-center mb-4" accessibilityElementsHidden={false} importantForAccessibility="no">
                <View className="flex-1 h-[1.09px] bg-gray-200 dark:bg-gray-800" />
                <View className="bg-white dark:bg-gray-950 px-4">
                  <Text className="text-sm font-medium text-muted-foreground dark:text-gray-300">OU</Text>
                </View>
                <View className="flex-1 h-[1.09px] bg-gray-200 dark:bg-gray-800" />
              </View>

              <TouchableOpacity
                onPress={handleSocialLogin}
                disabled={isLoading || isGoogleLoading}
                accessibilityRole="button"
                accessibilityLabel="Continuar com Google"
                accessibilityHint="Abre o login com sua conta Google"
                accessibilityState={{ busy: isGoogleLoading }}
                className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full items-center justify-center flex-row mb-4 gap-2 ${isGoogleLoading ? "opacity-70" : ""}`}
                style={{ minHeight: SECONDARY_BUTTON_HEIGHT, paddingVertical: 12 }}
                hitSlop={12}
              >
                {isGoogleLoading ? (
                  <ActivityIndicator size="small" color="#155DFC" accessibilityLabel="Carregando Google" />
                ) : (
                  <GoogleIcon size={16} />
                )}
                <Text className="text-gray-900 dark:text-gray-100 text-[16px] font-semibold tracking-tight">
                  {isGoogleLoading ? "ABRINDO..." : "Continuar com Google"}
                </Text>
              </TouchableOpacity>

              <View className="px-4 mb-6" accessible accessibilityRole="text">
                <Text
                  className="text-sm font-normal text-muted-foreground dark:text-gray-300 text-center"
                  style={{ lineHeight: 18 }}
                >
                  Nunca compartilharemos seus dados sem sua permissão
                </Text>
              </View>

              <View className="pt-4 mb-2.5">
                <TouchableOpacity
                  className="items-center"
                  onPress={handleRequestClose}
                  accessibilityRole="button"
                  accessibilityLabel="Continuar sem conta"
                  accessibilityHint="Fecha a folha e segue para o app sem login"
                >
                  <Text className="text-base font-normal text-muted-foreground dark:text-gray-300 tracking-tight">
                    Continuar sem conta
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

AuthBottomSheet.displayName = "AuthBottomSheet";
