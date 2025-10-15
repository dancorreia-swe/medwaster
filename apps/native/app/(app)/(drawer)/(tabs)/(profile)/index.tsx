import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Container } from "@/components/container";
import { useRouter } from "expo-router";
import {
  Calendar,
  Award,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import { Icon } from "@/components/icon";
import { authClient } from "@/lib/auth-client";
import {
  UserAvatar,
  ProfileStat,
  ActionCard,
  AchievementsSection,
} from "@/features/profile/components";

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const userName = session?.user.name || "Usuário";
  const userImage = session?.user.image;

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
          <View className="flex-row gap-[10.5px]">
            <ProfileStat
              icon={Award}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-50"
              value="124"
              label="Módulos"
              sublabel="completos"
            />
            <ProfileStat
              icon={Calendar}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
              value="82 min"
              label="Tempo"
              sublabel="estudado"
            />
            <ProfileStat
              icon={Calendar}
              iconColor="text-red-600"
              iconBgColor="bg-red-50"
              value="5 dias"
              label="Sequência"
              sublabel="atual"
            />
          </View>
        </View>

        {/* Achievements Section */}
        <AchievementsSection
          onViewAll={() =>
            router.push("/(app)/(drawer)/(tabs)/(profile)/achievements")
          }
        />

        {/* Action Cards Section */}
        <View className="px-5 py-3.5 gap-3.5">
          <ActionCard
            icon={Calendar}
            iconColor="text-red-600"
            iconBgColor="bg-red-50"
            title="Sequência & Calendário"
            description="Você está em uma sequência!"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/streak-calendar")
            }
          />
          <ActionCard
            icon={Award}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            title="Meus Certificados"
            description="12 certificados conquistados"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/certificates")
            }
          />
          <ActionCard
            icon={Users}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
            title="Convidar Colegas"
            description="Ganhe XP extra por indicação"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/invite")
            }
          />
          <ActionCard
            icon={Settings}
            iconColor="text-gray-600"
            iconBgColor="bg-gray-50"
            title="Configurações"
            description="Preferências e notificações"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/settings")
            }
          />
        </View>

        {/* Logout Button */}
        <View className="px-5 py-3.5">
          <TouchableOpacity className="h-[70px] rounded-xl items-center justify-center flex-row gap-2">
            <Icon icon={LogOut} size={17.5} className="text-red-600" />
            <Text className="text-sm font-medium text-red-600">
              Sair da Conta
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="px-5 py-3.5 items-center gap-[3.5px]">
          <Text className="text-[10.5px] text-gray-400 text-center">
            MedWaste Learning v1.0.0
          </Text>
          <Text className="text-[10.5px] text-gray-400 text-center">
            Gestão de Resíduos Hospitalares
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}
