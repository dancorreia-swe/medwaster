import { ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { StatsCard } from "@/features/home/components/stats-card";
import { UserAvatar } from "@/features/profile/components";
import { CategoryCard } from "@/features/home/components/category-card";
import { TrailCard } from "@/features/home/components/trail-card";
import { QuickAccessCard } from "@/features/home/components/quick-access-card";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session } = authClient.useSession();
  const userName = session?.user.name || "Usuário";
  const userImage = session?.user.image;
  const firstName = userName.split(" ")[0];

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* User Greeting Header */}
        <View className="bg-white border-b border-gray-100 px-5 py-3.5">
          <View className="flex-row items-center gap-3.5">
            <UserAvatar
              name={userName}
              imageUrl={userImage}
              size="sm"
              showBadge={false}
            />
            <View>
              <Text className="text-xs text-gray-600">Olá,</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {firstName}
              </Text>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="pt-5">
          {/* Stats Card */}
          <StatsCard streak={7} keyPoints={27} minutes={44} modules={3} />

          {/* Categories */}
          <View className="mx-5 mb-3.5">
            <Text className="text-lg font-semibold text-gray-900 mb-3.5">
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
              <Text className="text-lg font-semibold text-gray-900">
                Para você começar
              </Text>
              <Text className="text-xs text-gray-600">
                Trilhas recomendadas especialmente para você
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3.5 -mx-5 px-5"
              contentContainerStyle={{ paddingRight: 20 }}
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
            <Text className="text-lg font-semibold text-gray-900 mb-3.5">
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
