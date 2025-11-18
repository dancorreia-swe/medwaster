import { Container } from "@/components/container";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import ConfettiCannon from "react-native-confetti-cannon";
import {
  ChevronRight,
  Clock,
  Target,
  Trophy,
} from "lucide-react-native";

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
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    // Trigger confetti
    if (confettiRef.current) {
      confettiRef.current.start();
    }

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
    ]).start();
  }, []);

  const statCards = [
    {
      icon: Target,
      label: "Pontuação Final",
      value: `${score}%`,
      iconColor: "#FFFFFF",
      iconBgColor: "#3B82F6",
      textColor: "#2563EB",
      badge: isPassed ? { text: "APROVADO", bgColor: "#10B981" } : undefined,
    },
    {
      icon: Clock,
      label: "Tempo Investido",
      value: timeDisplay,
      iconColor: "#FFFFFF",
      iconBgColor: "#8B5CF6",
      textColor: "#7C3AED",
    },
    {
      icon: () => <Text style={{ fontSize: 28 }}>✓</Text>,
      label: "Módulos Concluídos",
      value: `${completedContent}/${totalContent}`,
      iconColor: "#FFFFFF",
      iconBgColor: "#10B981",
      textColor: "#059669",
    },
  ];

  return (
    <Container className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Confetti */}
      <ConfettiCannon
        ref={confettiRef}
        count={150}
        origin={{ x: Dimensions.get("window").width / 2, y: -10 }}
        autoStart={false}
        fadeOut={true}
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
            colors={isPassed ? ["#10B981", "#059669"] : ["#F59E0B", "#D97706"]}
            style={{
              paddingHorizontal: 24,
              paddingTop: 64,
              paddingBottom: 32,
            }}
          >
            {/* Trophy Icon - Animated */}
            <Animated.View
              style={{
                alignItems: "center",
                marginBottom: 24,
                transform: [{ scale: scaleAnim }],
              }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Trophy size={56} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: "bold",
                  color: "#FFFFFF",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                {isPassed ? "🎉 Parabéns! 🎉" : "Trilha Concluída!"}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  color: "rgba(255, 255, 255, 0.9)",
                  textAlign: "center",
                  paddingHorizontal: 16,
                }}
              >
                {isPassed
                  ? "Você concluiu a trilha com sucesso!"
                  : "Você completou todos os módulos!"}
              </Text>
            </Animated.View>

            {/* Trail Name */}
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255, 255, 255, 0.8)",
                  marginBottom: 4,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Trilha Concluída
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
            <Text style={{ fontSize: 20, fontWeight: "bold", color: "#111827", marginBottom: 24 }}>
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
                          backgroundColor: stat.iconBgColor,
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
                          backgroundColor: stat.badge.bgColor,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                        }}
                      >
                        <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "bold" }}>
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
              {/* Next Trail Button */}
              <TouchableOpacity
                onPress={() => router.push("/(app)/(tabs)/trails")}
                style={{
                  backgroundColor: "#155DFC",
                  borderRadius: 25,
                  paddingVertical: 16,
                  paddingHorizontal: 24,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>
                  Explorar Mais Trilhas
                </Text>
                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

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
