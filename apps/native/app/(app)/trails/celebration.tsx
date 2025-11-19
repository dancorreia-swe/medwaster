import { Container } from "@/components/container";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { PIConfetti, type ConfettiMethods } from "react-native-fast-confetti";
import { ChevronRight, Clock, Target } from "lucide-react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function TrailCelebrationScreen() {
  const params = useLocalSearchParams<{
    trailName: string;
    difficulty: string;
    score: string;
    isPassed: string;
    timeSpentMinutes: string;
    completedContent: string;
    totalContent: string;
  }>();

  const router = useRouter();

  // Parse params
  const score = Number(params.score) || 0;
  const isPassed = params.isPassed === "true";
  const timeSpentMinutes = Number(params.timeSpentMinutes) || 0;
  const completedContent = Number(params.completedContent) || 0;
  const totalContent = Number(params.totalContent) || 0;

  // Format time display
  const hours = Math.floor(timeSpentMinutes / 60);
  const minutes = timeSpentMinutes % 60;
  const timeDisplay = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const ctaPulse = useRef(new Animated.Value(1)).current;
  const confettiRef = useRef<ConfettiMethods | null>(null);

  useEffect(() => {
    // Trigger confetti
    confettiRef.current?.restart();

    // Start animations
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ctaPulse, {
            toValue: 1.03,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(ctaPulse, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, []);

  const accent = "#2563EB";
  const statCards = [
    {
      icon: Target,
      label: "Pontuação Final",
      value: `${score}%`,
      iconColor: accent,
      iconBgColor: accent,
      textColor: accent,
      badge: isPassed ? { text: "Aprovado", bgColor: accent } : undefined,
    },
    {
      icon: Clock,
      label: "Tempo Investido",
      value: timeDisplay,
      iconColor: accent,
      iconBgColor: accent,
      textColor: accent,
    },
    {
      icon: () => <Text style={{ fontSize: 26, color: accent }}>✓</Text>,
      label: "Módulos Concluídos",
      value: `${completedContent}/${totalContent}`,
      iconColor: "#FFFFFF",
      iconBgColor: accent,
      textColor: accent,
    },
  ];

  return (
    <Container className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Confetti drizzle */}
      <PIConfetti
        ref={confettiRef}
        count={28}
        colors={["#2563EB", "#10B981", "#FACC15", "#FFFFFF"]}
        fallDuration={1400}
        blastDuration={320}
        fadeOutOnEnd
        radiusRange={[2, 4]}
        sizeVariation={0.25}
        randomOffset={{
          x: { min: -60, max: 60 },
          y: { min: 0, max: 100 },
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
        }}
      />

      <Animated.View
        className="flex-1"
        style={{
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header with Gradient */}
          <LinearGradient
            colors={
              isPassed ? ["#0F172A", "#111827"] : ["#1E1B4B", "#111827"]
            }
            style={{
              paddingHorizontal: 24,
              paddingTop: 64,
              paddingBottom: 32,
            }}
          >
            {/* Trophy Illustration with soft glow */}
            <Animated.View
              style={{
                alignItems: "center",
                marginBottom: 24,
                transform: [{ scale: scaleAnim }],
                gap: 12,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: "rgba(255, 200, 0, 0.14)",
                  top: -12,
                  opacity: 0.9,
                }}
              />
              <View
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  source={require("@/assets/trophy.png")}
                  style={{ width: 120, height: 120 }}
                  resizeMode="contain"
                />
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: "bold",
                    color: "#FFFFFF",
                    textAlign: "center",
                  }}
                >
                  {isPassed ? "Parabéns!" : "Trilha Concluída"}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "rgba(255, 255, 255, 0.8)",
                    textAlign: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  {isPassed
                    ? "Você finalizou a trilha com sucesso."
                    : "Todos os módulos foram completados."}
                </Text>
              </View>
            </Animated.View>

            {/* Trail Name */}
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "rgba(255, 255, 255, 0.7)",
                  marginBottom: 4,
                  letterSpacing: 0.6,
                  textTransform: "uppercase",
                }}
              >
                Trilha
              </Text>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#FFFFFF",
                }}
              >
                {params.trailName}
              </Text>
            </View>
          </LinearGradient>

          {/* Stats Section */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 32 }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#0F172A", marginBottom: 24 }}>
              Seu Desempenho
            </Text>

            {/* Stats Grid */}
            <Animated.View
              style={{
                gap: 16,
                marginBottom: 32,
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              }}
            >
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <View
                    key={index}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                      padding: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                      borderWidth: 1,
                      borderColor: "#F3F4F6",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flex: 1 }}>
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          backgroundColor: `${stat.iconBgColor}20`,
                          borderRadius: 32,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={30} color={stat.iconColor} strokeWidth={2.5} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: stat.textColor,
                            fontWeight: "500",
                            marginBottom: 4,
                          }}
                        >
                          {stat.label}
                        </Text>
                        <Text style={{ fontSize: 30, fontWeight: "bold", color: "#111827" }}>
                          {stat.value}
                        </Text>
                      </View>
                    </View>
                    {stat.badge && (
                      <View
                        style={{
                          backgroundColor: `${stat.badge.bgColor}15`,
                          paddingHorizontal: 14,
                          paddingVertical: 6,
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: `${stat.badge.bgColor}40`,
                        }}
                      >
                        <Text style={{ color: stat.badge.bgColor, fontSize: 12, fontWeight: "700" }}>
                          {stat.badge.text}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </Animated.View>

            {/* Actions */}
            <Animated.View
              style={{
                gap: 12,
                opacity: fadeAnim,
              }}
            >
              {/* Next Trail Button with subtle pulse */}
              <Animated.View style={{ transform: [{ scale: ctaPulse }] }}>
                <TouchableOpacity
                  onPress={() => router.push("/(app)/(tabs)/trails")}
                  style={{
                    backgroundColor: accent,
                    borderRadius: 25,
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    shadowColor: accent,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.25,
                    shadowRadius: 14,
                    elevation: 6,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>
                    Explorar Mais Trilhas
                  </Text>
                  <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </Animated.View>

              {/* Home Button */}
              <TouchableOpacity
                onPress={() => router.push("/(app)/(tabs)")}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderWidth: 2,
                  borderColor: "#E5E7EB",
                  borderRadius: 25,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#374151", fontSize: 16, fontWeight: "bold" }}>
                  Voltar ao Início
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </Animated.View>
    </Container>
  );
}
