import { Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { Image } from "expo-image";
import { LandingHeroImage } from "@/components/landing-hero-image";
import {
  AuthBottomSheet,
  type AuthBottomSheetRef,
} from "@/components/auth-bottom-sheet";
import { useRef, useCallback } from "react";
import { Asset, useAssets } from "expo-asset";

export default function Landing() {
  const authBottomSheetRef = useRef<AuthBottomSheetRef>(null);
  const [assets] = useAssets([require("../../assets/medwaster-mascot.png")]);

  const handleOpenSignIn = useCallback(() => {
    authBottomSheetRef.current?.switchToSignIn();
    authBottomSheetRef.current?.expand();
  }, []);

  const handleOpenSignUp = useCallback(() => {
    authBottomSheetRef.current?.switchToSignUp();
    authBottomSheetRef.current?.expand();
  }, []);

  const handleClose = useCallback(() => {
    authBottomSheetRef.current?.close();
  }, []);

  return (
    <Container>
      <View className="h-10" />

      <View className="flex-1 items-center justify-center px-8">
        <View>
          <Image
            source={assets?.[0]}
            style={{ width: 400, height: 400 }}
            contentFit="contain"
          />
        </View>

        <View className="mb-6">
          <Text className="text-5xl font-bold text-primary text-center tracking-tight">
            Medwaster
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-[15.75px] leading-[25.6px] text-[#4A5565] text-center tracking-tight">
            A maneira gratuita, divertida e eficaz de aprender sobre descarte
            correto de resíduos hospitalares!
          </Text>
        </View>
      </View>

      <View className="px-5 pb-12 gap-6">
        <TouchableOpacity
          onPress={handleOpenSignUp}
          className="bg-[#155DFC] rounded-[14px] py-4 items-center justify-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        >
          <Text className="text-white font-bold text-xl tracking-tight">
            COMEÇAR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleOpenSignIn}>
          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-[14px] text-[#364153] tracking-tight">
              Já tem uma conta?
            </Text>
            <Text className="text-blue-500 font-bold tracking-tight">
              Entre
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <AuthBottomSheet ref={authBottomSheetRef} onClose={handleClose} />
    </Container>
  );
}
