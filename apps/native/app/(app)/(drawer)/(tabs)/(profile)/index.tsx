import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
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

export default function ProfileScreen() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const getUserInitials = () => {
    const fullName = session?.user.name || "User";
    const names = fullName.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const userName = session?.user.name || "Usuário";
  const userImage = session?.user.image;

  return (
    <Container className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-[42px] px-5">
          <Text className="text-[28px] font-bold text-gray-900">Perfil</Text>
        </View>

        {/* User Card */}
        <View className="mx-0 border-b border-gray-100">
          <View className="px-5 py-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-[21px] font-bold text-gray-900">
                {userName}
              </Text>
              <View className="flex-row items-center gap-3.5">
                {/* Avatar */}
                <View className="w-14 h-14 rounded-full bg-gray-50 border-2 border-gray-200 items-center justify-center overflow-hidden">
                  {userImage ? (
                    <Image
                      source={{ uri: userImage }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Text className="text-[21px] font-bold text-gray-600">
                      {getUserInitials()}
                    </Text>
                  )}
                </View>
                {/* Status Badge */}
                <View className="w-5 h-5 rounded-full bg-blue-500 shadow-md items-center justify-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View className="flex-row px-5 py-5 gap-[10.5px]">
          {/* Modules */}
          <View className="flex-1 items-center gap-[3.5px]">
            <View className="w-12 h-12 rounded-full bg-purple-50 items-center justify-center mb-2">
              <Icon icon={Award} size={21} className="text-purple-600" />
            </View>
            <Text className="text-[21px] font-bold text-gray-900 text-center">
              124
            </Text>
            <Text className="text-[10.5px] font-normal text-gray-600 uppercase tracking-wider text-center">
              Módulos
            </Text>
            <Text className="text-[10.5px] font-normal text-gray-400 text-center">
              completos
            </Text>
          </View>

          {/* Time */}
          <View className="flex-1 items-center gap-[3.5px]">
            <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center mb-2">
              <Icon icon={Calendar} size={21} className="text-green-600" />
            </View>
            <Text className="text-[21px] font-bold text-gray-900 text-center">
              82 min
            </Text>
            <Text className="text-[10.5px] font-normal text-gray-600 uppercase tracking-wider text-center">
              Tempo
            </Text>
            <Text className="text-[10.5px] font-normal text-gray-400 text-center">
              estudado
            </Text>
          </View>

          {/* Streak */}
          <View className="flex-1 items-center gap-[3.5px]">
            <View className="w-12 h-12 rounded-full bg-red-50 items-center justify-center mb-2">
              <Icon icon={Calendar} size={21} className="text-red-600" />
            </View>
            <Text className="text-[21px] font-bold text-gray-900 text-center">
              5 dias
            </Text>
            <Text className="text-[10.5px] font-normal text-gray-600 uppercase tracking-wider text-center">
              Sequência
            </Text>
            <Text className="text-[10.5px] font-normal text-gray-400 text-center">
              atual
            </Text>
          </View>
        </View>

        <View className="px-5 gap-[10.5px]">
          {/* Streak & Calendar */}
          <TouchableOpacity
            className="bg-white rounded-xl border border-gray-100 shadow-sm"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/streak-calendar")
            }
          >
            <View className="p-3.5 flex-row items-center gap-3.5">
              <View className="w-[42px] h-[42px] rounded-full bg-red-50 items-center justify-center">
                <Icon icon={Calendar} size={21} className="text-red-600" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-0.5">
                  Sequência & Calendário
                </Text>
                <Text className="text-xs text-gray-600">
                  Você está em uma sequência!
                </Text>
              </View>
              <Icon icon={ChevronRight} size={17.5} className="text-gray-400" />
            </View>
          </TouchableOpacity>

          {/* Invite Friends */}
          <TouchableOpacity
            className="bg-white rounded-xl border border-gray-100 shadow-sm shadow-black/15"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/invite")
            }
          >
            <View className="p-3.5 flex-row items-center gap-3.5">
              <View className="w-[42px] h-[42px] rounded-full bg-green-50 items-center justify-center">
                <Icon icon={Users} size={21} className="text-green-600" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-0.5">
                  Convidar Colegas
                </Text>
                <Text className="text-xs text-gray-600">
                  Ganhe XP extra por indicação
                </Text>
              </View>
              <Icon icon={ChevronRight} size={17.5} className="text-gray-400" />
            </View>
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            className="bg-white rounded-xl border border-gray-100 shadow-sm"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/settings")
            }
          >
            <View className="p-3.5 flex-row items-center gap-3.5">
              <View className="w-[42px] h-[42px] rounded-full bg-gray-50 items-center justify-center">
                <Icon icon={Settings} size={21} className="text-gray-600" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900 mb-0.5">
                  Configurações
                </Text>
                <Text className="text-xs text-gray-600">
                  Preferências e notificações
                </Text>
              </View>
              <Icon icon={ChevronRight} size={17.5} className="text-gray-400" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Achievements Section */}
        <View className="px-5 py-3.5 gap-3.5">
          <Text className="text-[17.5px] font-bold text-gray-900">
            Conquistas
          </Text>

          {/* Achievement Card - simplified for now, full implementation would need achievement components */}
          <TouchableOpacity
            className="bg-white rounded-xl border border-gray-100 shadow-sm"
            onPress={() =>
              router.push("/(app)/(drawer)/(tabs)/(profile)/achievements")
            }
          >
            <View className="p-3.5">
              {/* First Achievement */}
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
                <Icon
                  icon={ChevronRight}
                  size={17.5}
                  className="text-gray-400"
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View className="px-5 py-3.5">
          <TouchableOpacity className="h-12 rounded-xl items-center justify-center flex-row gap-2">
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
