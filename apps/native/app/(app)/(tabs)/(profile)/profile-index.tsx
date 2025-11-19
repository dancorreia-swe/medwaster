import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Container } from "@/components/container";
import { useRouter } from "expo-router";
import { Calendar, Award, Settings, LogOut, HelpCircle } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { authClient } from "@/lib/auth-client";
import {
  UserAvatar,
  ProfileStat,
  ActionCard,
  AchievementsSection,
  useProfileStats,
} from "@/features/profile";
import { useUserStreak } from "@/features/gamification/hooks";

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { data: profileStats, isLoading: isLoadingStats } = useProfileStats();
  const { data: streakData, isLoading: isLoadingStreak } = useUserStreak();

  const userName = session?.user.name || "Usuário";
  const userImage = session?.user.image;

  // Calculate stats
  const completedTrails = profileStats?.stats.trails.completed || 0;
  const questionsAnswered = profileStats?.stats.questions?.uniqueQuestions || 0;
  const longestStreak = streakData?.longestStreak || 0;

  const isLoading = isLoadingStats || isLoadingStreak;

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-3.5 pb-0">
          <View className="py-4">
            <Text className="text-4xl font-bold text-gray-900">Perfil</Text>
          </View>
        </View>

        {/* User Card */}
        <View className="bg-white border-b border-gray-200 px-5 py-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-3xl font-bold text-gray-900">{userName}</Text>
            <UserAvatar
              name={userName}
              imageUrl={userImage}
              size="md"
              showBadge={false}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View className="bg-white px-5 py-5">
          {isLoading ? (
            <View className="h-24 items-center justify-center">
              <ActivityIndicator size="small" color="#2B7FFF" />
            </View>
          ) : (
            <View className="flex-row gap-[10.5px]">
              <ProfileStat
                icon={Award}
                iconColor="text-purple-600"
                iconBgColor="bg-purple-50"
                value={completedTrails.toString()}
                label="Trilhas"
                sublabel="completas"
              />
              <ProfileStat
                icon={HelpCircle}
                iconColor="text-blue-600"
                iconBgColor="bg-blue-50"
                value={questionsAnswered.toString()}
                label="Questões"
                sublabel="respondidas"
              />
              <ProfileStat
                icon={Calendar}
                iconColor="text-red-600"
                iconBgColor="bg-red-50"
                value={`${longestStreak} ${longestStreak === 1 ? 'dia' : 'dias'}`}
                label="Maior"
                sublabel="sequência"
              />
            </View>
          )}
        </View>

        {/* Achievements Section */}
        <AchievementsSection
          onViewAll={() => router.push("/(app)/(tabs)/(profile)/achievements")}
        />

        {/* Action Cards Section */}
        <View className="px-5 py-4 gap-3.5">
          {/* <ActionCard */}
          {/*   icon={Calendar} */}
          {/*   iconColor="text-red-600" */}
          {/*   iconBgColor="bg-red-50" */}
          {/*   title="Sequência & Calendário" */}
          {/*   description="Verifique sua sequência de estudos" */}
          {/*   onPress={() => */}
          {/*     router.push("/(app)/(tabs)/(profile)/streak-calendar") */}
          {/*   } */}
          {/* /> */}
          <ActionCard
            icon={Award}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            title="Meu Certificado"
            description="Veja o status do seu certificado"
            onPress={() => router.push("/(app)/(tabs)/(profile)/certificates")}
          />
          <ActionCard
            icon={Settings}
            iconColor="text-gray-600"
            iconBgColor="bg-gray-50"
            title="Configurações"
            description="Preferências e notificações"
            onPress={() => router.push("/(app)/(tabs)/(profile)/settings")}
          />
        </View>

        {/* Logout Button */}
        <View className="px-5 py-6">
          <TouchableOpacity
            className="rounded-xl items-center justify-center flex-row gap-2"
            onPress={() => authClient.signOut()}
          >
            <Icon icon={LogOut} size={16} className="text-red-600" />
            <Text className="text-sm font-medium text-red-600">
              Sair da Conta
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
}
