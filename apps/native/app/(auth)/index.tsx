import { Link } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Container } from "@/components/container";
import { LandingHeroImage } from "@/components/landing-hero-image";
import { SignInBottomSheet } from "@/components/sign-in-bottom-sheet";
import { useRef, useCallback } from "react";
import type BottomSheet from "@gorhom/bottom-sheet";

export default function Landing() {
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleOpenSignIn = useCallback(() => {
    bottomSheetRef.current?.expand();
  }, []);

  const handleCloseSignIn = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return (
    <Container>
      <View className="h-10" />

      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-8">
          <LandingHeroImage width={200} height={200} />
        </View>

        <View className="mb-6">
          <Text className="text-[42px] font-bold text-[#155DFC] text-center tracking-tight">
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

      <View className="px-5 pb-6 gap-[17px]">
        <Link href="/(auth)/sign-up" asChild>
          <TouchableOpacity
            className="bg-[#155DFC] rounded-[14px] py-4 items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
            }}
          >
            <Text className="text-white font-bold text-[14px] tracking-tight">
              COMEÇAR
            </Text>
          </TouchableOpacity>
        </Link>

        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-[14px] text-[#364153] tracking-tight">
            Já tem uma conta?
          </Text>
          <TouchableOpacity onPress={handleOpenSignIn}>
            <Text className="text-[14px] text-[#155DFC] font-bold tracking-tight">
              Entre
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign In Bottom Sheet */}
      <SignInBottomSheet ref={bottomSheetRef} onClose={handleCloseSignIn} />
    </Container>
  );
}
