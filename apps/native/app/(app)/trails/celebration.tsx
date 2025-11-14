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
  Award,
  ChevronRight,
  Clock,
  Target,
  Trophy,
  X,
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
    earnedPoints?: string;
  }>();

  const router = useRouter();

  // Parse params
  const score = Number(params.score) || 0;
  const isPassed = params.isPassed === "true";
  const timeSpentMinutes = Number(params.timeSpentMinutes) || 0;
  const completedContent = Number(params.completedContent) || 0;
  const totalContent = Number(params.totalContent) || 0;
  const earnedPoints = params.earnedPoints
    ? Number(params.earnedPoints)
    : undefined;

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
      color: "#3B82F6",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-500",
      textColor: "text-blue-600",
      valueColor: "text-blue-900",
      badge: isPassed ? { text: "APROVADO", color: "bg-green-500" } : undefined,
    },
    {
      icon: Clock,
      label: "Tempo Investido",
      value: timeDisplay,
      color: "#8B5CF6",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-500",
      textColor: "text-purple-600",
      valueColor: "text-purple-900",
    },
    ...(earnedPoints !== undefined && earnedPoints > 0
      ? [
          {
            icon: Award,
            label: "Pontos Conquistados",
            value: `+${earnedPoints}`,
            color: "#F59E0B",
            bgColor: "bg-amber-50",
            iconBg: "bg-amber-500",
            textColor: "text-amber-600",
            valueColor: "text-amber-900",
          },
        ]
      : []),
    {
      icon: () => <Text className="text-2xl">✓</Text>,
      label: "Módulos Concluídos",
      value: `${completedContent}/${totalContent}`,
      color: "#10B981",
      bgColor: "bg-green-50",
      iconBg: "bg-green-500",
      textColor: "text-green-600",
      valueColor: "text-green-900",
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
            className="px-6 pt-16 pb-8 relative"
          >
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute top-12 right-4 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <X size={24} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Trophy Icon - Animated */}
            <Animated.View
              className="items-center mb-6"
              style={{
                transform: [{ scale: scaleAnim }],
              }}
            >
              <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4">
                <Trophy size={56} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text className="text-3xl font-bold text-white text-center mb-2">
                {isPassed ? "🎉 Parabéns! 🎉" : "Trilha Concluída!"}
              </Text>
              <Text className="text-lg text-white/90 text-center px-4">
                {isPassed
                  ? "Você concluiu a trilha com sucesso!"
                  : "Você completou todos os módulos!"}
              </Text>
            </Animated.View>

            {/* Trail Name */}
            <View className="bg-white/20 rounded-2xl px-5 py-4">
              <Text className="text-sm text-white/80 mb-1 uppercase tracking-wide">
                Trilha Concluída
              </Text>
              <Text className="text-xl font-bold text-white">
                {params.trailName}
              </Text>
            </View>
          </LinearGradient>

          {/* Stats Section */}
          <View className="px-6 py-8">
            <Text className="text-xl font-bold text-gray-900 mb-6">
              Seu Desempenho
            </Text>

            {/* Stats Grid */}
            <Animated.View
              className="gap-4 mb-8"
              style={{
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
                    className="bg-white rounded-2xl p-5 flex-row items-center justify-between shadow-sm border border-gray-100"
                  >
                    <View className="flex-row items-center gap-4 flex-1">
                      <View
                        className={`w-16 h-16 ${stat.iconBg} rounded-full items-center justify-center`}
                      >
                        <Icon size={30} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className={`text-sm ${stat.textColor} font-medium mb-1`}
                        >
                          {stat.label}
                        </Text>
                        <Text className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </Text>
                      </View>
                    </View>
                    {stat.badge && (
                      <View
                        className={`${stat.badge.color} px-4 py-2 rounded-full`}
                      >
                        <Text className="text-white text-xs font-bold">
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
              className="gap-3"
              style={{
                opacity: fadeAnim,
              }}
            >
              {/* Next Trail Button */}
              <TouchableOpacity
                onPress={() => router.push("/(app)/(tabs)/trails")}
                className="bg-primary rounded-full py-4 px-6 flex-row items-center justify-center gap-2"
              >
                <Text className="text-white text-base font-bold">
                  Explorar Mais Trilhas
                </Text>
                <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Home Button */}
              <TouchableOpacity
                onPress={() => router.push("/(app)/(tabs)")}
                className="bg-white border-2 border-gray-200 rounded-full py-4 px-6 flex-row items-center justify-center"
              >
                <Text className="text-gray-700 text-base font-bold">
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
