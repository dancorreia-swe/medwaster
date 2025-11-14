import { ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { StatsCard } from "@/features/home/components/stats-card";
import { CategoryCard } from "@/features/home/components/category-card";
import { TrailCard } from "@/features/home/components/trail-card";
import { QuickAccessCard } from "@/features/home/components/quick-access-card";
import { authClient } from "@/lib/auth-client";
import { useStudentCategories } from "@/features/wiki/hooks";
import { router } from "expo-router";
import { useArticleStore } from "@/lib/stores/article-store";

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
  const { data: categoriesResponse } = useStudentCategories();
  const setSelectedCategoriesInStore = useArticleStore(
    (state) => state.setSelectedCategories,
  );

  const categories = categoriesResponse ?? [];

  const handleCategoryPress = (categoryId: number) => {
    // Set the category in the store so wiki tab can read it
    setSelectedCategoriesInStore([categoryId]);
    
    // Navigate to wiki tab
    router.push("/(tabs)/wiki");
  };

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* App Header */}
        <View className="border-gray-100 px-5 py-3.5">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-xl bg-primary items-center justify-center">
              <Text className="text-white text-base font-bold">M</Text>
            </View>
            <Text className="text-xl font-semibold text-gray-900">
              Medwaster
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View className="pt-2 bg-gray-50 flex gap-3">
          {/* Stats Card */}
          <StatsCard />

          {/* Categories */}
          {categories.length > 0 && (
            <View className="mx-5 mb-5">
              <Text className="text-base font-bold text-gray-900 mb-3.5">
                Categorias de interesse
              </Text>
              <View className="flex-row flex-wrap gap-3.5">
                {categories.slice(0, 6).map((category, index) => {
                  const colors = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                  return (
                    <View key={category.id} className="flex-1 min-w-[45%]">
                      <CategoryCard
                        title={category.name}
                        bgColor={colors.bg}
                        iconColor={colors.icon}
                        onPress={() => handleCategoryPress(category.id)}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Recommended Trails */}
          <View className="mb-5">
            <View className="px-5 mb-3.5">
              <Text className="text-base font-bold text-gray-900 mb-1">
                Para você começar
              </Text>
              <Text className="text-sm text-gray-600">
                Trilhas recomendadas especialmente para você
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-5 pb-1"
              contentContainerStyle={{ paddingRight: 20, gap: 14 }}
            >
              <TrailCard
                title="Descarte de Perfurocortantes"
                category="Perfurocortantes"
                duration="15 min"
                gradientColors={["#2B7FFF", "#00B8DB"]}
                categoryBg="rgba(255, 255, 255, 0.2)"
                status="new"
              />
              <TrailCard
                title="Gestão de Resíduos Químicos"
                category="Químicos"
                duration="20 min"
                gradientColors={["#AD46FF", "#F6339A"]}
                categoryBg="rgba(255, 255, 255, 0.2)"
                status="recommended"
              />
              <TrailCard
                title="Segregação de Infectantes"
                category="Infectantes"
                duration="18 min"
                gradientColors={["#00C950", "#00BC7D"]}
                categoryBg="rgba(255, 255, 255, 0.2)"
                status="recommended"
              />
            </ScrollView>
          </View>

          {/* Quick Access */}
          <View className="mx-5 mb-6">
            <Text className="text-base font-bold text-gray-900 mb-3.5">
              Acesso rápido
            </Text>
            <View className="gap-2.5">
              <QuickAccessCard
                title="Biblioteca Wiki"
                description="Consulte protocolos e diretrizes"
                iconBgColor="#EFF6FF"
                iconColor="#155DFC"
                icon="library"
              />
              <QuickAccessCard
                title="Minhas Conquistas"
                description="Veja seu progresso e medalhas"
                iconBgColor="#F0FDF4"
                iconColor="#00A63E"
                icon="award"
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
