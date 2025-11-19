import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { Container } from "@/components/container";
import { StatsCard } from "@/features/home/components/stats-card";
import { CategoryCard } from "@/features/home/components/category-card";
import { TrailCard } from "@/features/home/components/trail-card";
import { QuickAccessCard } from "@/features/home/components/quick-access-card";
import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useArticleStore } from "@/lib/stores/article-store";
import { useAchievementNotifications } from "@/features/achievements";
import {
  useRecommendedTrails,
  useRecommendedCategories,
} from "@/features/trails/hooks";
import { useUserCertificate } from "@/features/certificates";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { Trophy } from "lucide-react-native";

const CATEGORY_COLORS = [
  { bg: "#EFF6FF", icon: "#155DFC" },
  { bg: "#FAF5FF", icon: "#9810FA" },
  { bg: "#FEF2F2", icon: "#E7000B" },
  { bg: "#FFFBEB", icon: "#E17100" },
  { bg: "#F0FDF4", icon: "#00A63E" },
  { bg: "#FFF7ED", icon: "#F97316" },
];

export default function Home() {
  const { data: session } = authClient.useSession();
  const { data: recommendedCategories, isLoading: isLoadingCategories } =
    useRecommendedCategories();
  const { data: recommendedTrails, isLoading: isLoadingRecommended } =
    useRecommendedTrails();
  const { data: certificateData } = useUserCertificate();
  const setSelectedCategoriesInStore = useArticleStore(
    (state) => state.setSelectedCategories,
  );

  // Check for new achievements when home screen is active
  useAchievementNotifications();

  const categories = recommendedCategories ?? [];
  const trails = recommendedTrails ?? [];

  const uniqueTrails = useMemo(() => {
    return trails.filter(
      (trail, index, self) => index === self.findIndex((t) => t.id === trail.id),
    );
  }, [trails]);

  const hasCompletedAllTrails = certificateData?.certificate !== null;

  const handleCategoryPress = (categoryId: number) => {
    setSelectedCategoriesInStore([categoryId]);
    router.push("/(tabs)/wiki");
  };

  // TEST: Manual achievement toast trigger
  const showTestAchievement = () => {
    toast.custom(
      <View className="bg-white rounded-2xl shadow-2xl border-2 border-green-500 p-4 mx-4">
        <View className="flex-row items-center">
          {/* Icon */}
          <View
            className="w-14 h-14 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: "#fbbf2420" }}
          >
            <Icon icon={Trophy} size={28} color="#fbbf24" />
          </View>

          {/* Content */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1 gap-1">
              <Image 
                source={require("@/assets/medal.png")}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
              <Text className="text-xs font-bold text-green-600 uppercase tracking-wide">
                CONQUISTA DESBLOQUEADA!
              </Text>
            </View>
            <Text className="text-base font-bold text-gray-900 mb-1">
              Primeira Vitória
            </Text>
            <Text className="text-sm text-gray-600" numberOfLines={1}>
              Complete sua primeira trilha de aprendizado
            </Text>
          </View>

          {/* Sparkle */}
          <View className="ml-2">
            <Text className="text-2xl">✨</Text>
          </View>
        </View>
      </View>,
      {
        duration: 4000,
      }
    );
  };

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View className="border-gray-100 px-5 py-3.5">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2.5">
              <Image 
                source={require("@/assets/mini-icon.png")}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
              <Text className="text-xl font-semibold text-gray-900">
                Medwaster
              </Text>
            </View>
            {__DEV__ && (
              <TouchableOpacity
                onPress={showTestAchievement}
                className="bg-green-500 px-3 py-1.5 rounded-lg"
              >
                <Text className="text-white text-xs font-bold">🏆 TEST</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View className="pt-2 bg-gray-50 flex gap-3">
          {/* Stats Card */}
          <StatsCard />

          {/* Categories */}
          <View className="mx-5 mb-5">
            <View className="flex-row items-center gap-2.5 mb-3.5">
              <Image 
                source={require("@/assets/book.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
              <Text className="text-lg font-bold text-gray-900">
                Categorias de interesse
              </Text>
            </View>
            {isLoadingCategories ? (
              <View className="h-32 items-center justify-center">
                <ActivityIndicator size="small" color="#155DFC" />
              </View>
            ) : categories.length > 0 ? (
              <View className="gap-3">
                {categories.slice(0, 3).map((category, index) => {
                  const colors =
                    CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                  return (
                    <CategoryCard
                      key={category.id}
                      title={category.name}
                      bgColor={colors.bg}
                      iconColor={colors.icon}
                      onPress={() => handleCategoryPress(category.id)}
                    />
                  );
                })}
              </View>
            ) : (
              <Text className="text-sm text-gray-500 text-center py-8">
                Continue explorando conteúdos para receber recomendações
                personalizadas!
              </Text>
            )}
          </View>

          {/* Recommended Trails */}
          <View className="mb-5">
            <View className="px-5 mb-3.5">
              <View className="flex-row items-center gap-2.5 mb-1">
                <Image 
                  source={require("@/assets/compass.png")}
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <Text className="text-lg font-bold text-gray-900">
                  Para você começar
                </Text>
              </View>
              <Text className="text-sm text-gray-600 ml-[34px]">
                Trilhas recomendadas especialmente para você
              </Text>
            </View>

            {isLoadingRecommended ? (
              <View className="h-48 items-center justify-center">
                <ActivityIndicator size="small" color="#155DFC" />
              </View>
            ) : uniqueTrails.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="pb-1"
                contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, gap: 14 }}
              >
                {uniqueTrails.map((trail, index) => (
                  <TrailCard
                    key={trail.id}
                    title={trail.name}
                    category={trail.category?.name ?? "Geral"}
                    duration="15 min"
                    gradientColors={
                      index % 3 === 0
                        ? ["#2B7FFF", "#00B8DB"]
                        : index % 3 === 1
                          ? ["#AD46FF", "#F6339A"]
                          : ["#00C950", "#00BC7D"]
                    }
                    categoryBg="rgba(255, 255, 255, 0.2)"
                    status={index === 0 ? "new" : "recommended"}
                    onPress={() => router.push(`/trails/${trail.id}`)}
                  />
                ))}
              </ScrollView>
            ) : (
              <View className="px-5">
                <Text className="text-sm text-gray-500 text-center py-8">
                  {hasCompletedAllTrails
                    ? "🎉 Parabéns! Você completou todas as trilhas disponíveis!"
                    : "Comece completando trilhas para receber recomendações personalizadas!"}
                </Text>
              </View>
            )}
          </View>

          {/* Continue Learning */}
          <View className="mx-5 mb-6">
            <View className="flex-row items-center gap-2.5 mb-1">
              <Image 
                source={require("@/assets/star.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
              />
              <Text className="text-lg font-bold text-gray-900">
                Continue aprendendo
              </Text>
            </View>
            <Text className="text-sm text-gray-600 mb-3.5 ml-[34px]">
              Acompanhe seu progresso e conquistas
            </Text>

            {/* Certificate Banner if completed all trails */}
            {hasCompletedAllTrails && certificateData?.certificate && (
              <TouchableOpacity
                onPress={() =>
                  router.push("/(app)/(tabs)/(profile)/certificates")
                }
                activeOpacity={0.8}
                className="rounded-full mb-3 overflow-hidden shadow-lg"
              >
                <LinearGradient
                  colors={["#155DFC", "#0B4FDB"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    padding: 4
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                      <Text className="text-2xl">🏆</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">
                        Certificado Disponível
                      </Text>
                      <Text className="text-white/80 text-sm">
                        {certificateData.certificate.status === "approved"
                          ? "Toque para visualizar"
                          : "Aguardando aprovação"}
                      </Text>
                    </View>
                    <View className="w-8 h-8 bg-white/10 rounded-full items-center justify-center mr-4">
                      <Text className="text-white text-xl">→</Text>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Learning Stats */}
            <View className="bg-white rounded-2xl p-5 border border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">
                    Trilhas Concluídas
                  </Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {certificateData?.certificate?.totalTrailsCompleted ?? 0}
                  </Text>
                </View>
                <View className="w-px h-10 bg-gray-200" />
                <View className="flex-1 items-center">
                  <Text className="text-xs text-gray-500 mb-1">
                    Média Geral
                  </Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {certificateData?.certificate?.averageScore
                      ? `${certificateData.certificate.averageScore.toFixed(0)}%`
                      : "-"}
                  </Text>
                </View>
                <View className="w-px h-10 bg-gray-200" />
                <View className="flex-1 items-end">
                  <Text className="text-xs text-gray-500 mb-1">
                    Tempo Total
                  </Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {certificateData?.certificate?.totalTimeMinutes
                      ? `${Math.floor(certificateData.certificate.totalTimeMinutes / 60)}h`
                      : "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
