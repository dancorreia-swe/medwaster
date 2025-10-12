import { ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { StatsCard } from "@/features/home/components/stats-card";
import { HomeHeader } from "@/features/home/components/home-header";
import { CategoryCard } from "@/features/home/components/category-card";
import { TrailCard } from "@/features/home/components/trail-card";
import { QuickAccessCard } from "@/features/home/components/quick-access-card";
import { verifyInstallation } from "nativewind";

export default function Home() {
  verifyInstallation();

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <Container className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <HomeHeader />

          <StatsCard streak={7} keyPoints={27} minutes={44} modules={3} />

          <View className="mx-5 mb-3.5">
            <Text className="text-lg font-semibold text-[#0A0A0A] mb-3.5">
              Categorias de interesse
            </Text>
            <View className="flex-row flex-wrap gap-3.5">
              <View className="flex-1 min-w-[45%]">
                <CategoryCard
                  title="Perfurocortantes"
                  bgColor="#EFF6FF"
                  iconColor="#155DFC"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <CategoryCard
                  title="Químicos"
                  bgColor="#FAF5FF"
                  iconColor="#9810FA"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <CategoryCard
                  title="Infectantes"
                  bgColor="#FEF2F2"
                  iconColor="#E7000B"
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <CategoryCard
                  title="Radioativos"
                  bgColor="#FFFBEB"
                  iconColor="#E17100"
                />
              </View>
            </View>
          </View>

          {/* Recommended Trails */}
          <View className="mx-5 mb-3.5">
            <View className="mb-1">
              <Text className="text-lg font-semibold text-[#0A0A0A]">
                Para você começar
              </Text>
              <Text className="text-[12.25px] text-[#6B7280]">
                Trilhas recomendadas especialmente para você
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3.5 -mx-5 px-5 py-4"
            >
              <TrailCard
                title="Descarte de Perfurocortantes"
                category="Perfurocortantes"
                duration="15 min"
                gradient="from-[#2B7FFF] to-[#00B8DB]"
                categoryBg="rgba(255, 255, 255, 0.2)"
                status="new"
              />
            </ScrollView>
          </View>

          {/* Quick Access */}
          <View className="mx-5 mb-6">
            <Text className="text-lg font-semibold text-[#0A0A0A] mb-3.5">
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
        </ScrollView>
      </Container>
    </View>
  );
}
