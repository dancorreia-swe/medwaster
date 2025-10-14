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
  UserCard,
  ProfileStat,
  ActionCard,
} from "@/features/profile/components";

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const userName = session?.user.name || "Usuário";
  const userImage = session?.user.image;

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-4 pb-0">
          <View className="flex-row items-center gap-2.5 py-3.5 mb-3">
            <Text className="text-4xl font-bold text-gray-900">Perfil</Text>
          </View>
        </View>

        <UserCard
          name={userName}
          avatar={
            <UserAvatar
              name={userName}
              imageUrl={userImage}
              size="md"
              showBadge={true}
            />
          }
        />

        <View className="flex-row px-5 py-5 gap-[10.5px]">
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

        <View className="px-5 gap-3">
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

        {/* Achievements Section */}
        <View className="px-5 py-8 gap-3.5">
          <Text className="text-lg font-bold text-gray-900">Conquistas</Text>

          <TouchableOpacity
            className="bg-white rounded-xl border border-gray-100 shadow-sm"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/achievements")
            }
          >
            <View className="p-3.5">
              <View className="flex-row items-center pb-3.5 border-b border-gray-100">
                <View className="flex-1 gap-[3.5px]">
                  <Text className="text-sm font-semibold text-gray-900">
                    Iniciante
                  </Text>
                  <Text className="text-xs text-gray-600">
                    Complete seu primeiro quiz sobre descarte de resíduos
                  </Text>
                  <View className="flex-row items-center gap-[10.5px] mt-2">
                    <View className="flex-1 h-[7px] bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                        style={{ width: "100%" }}
                      />
                    </View>
                    <Text className="text-xs font-medium text-gray-400">
                      1/1
                    </Text>
                  </View>
                </View>
                <View className="ml-3.5 items-center gap-2">
                  <View className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-md items-center justify-center">
                    <Text className="text-[21px]">🎯</Text>
                  </View>
                  <View className="px-2 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <Text className="text-[10.5px] font-bold text-gray-700">
                      L1
                    </Text>
                  </View>
                </View>
              </View>

              {/* See More */}
              <TouchableOpacity className="flex-row items-center justify-between pt-3.5">
                <Text className="text-sm font-medium text-gray-900">
                  Ver mais 5
                </Text>
                <Icon icon={ChevronRight} size={16} className="text-gray-400" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View className="px-5 py-3.5">
          <TouchableOpacity className="h-12 rounded-xl items-center justify-center flex-row gap-2">
            <Icon icon={LogOut} size={16} className="text-red-600" />
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
