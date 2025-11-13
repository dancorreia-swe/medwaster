import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Container } from "@/components/container";
import { useUserMissions } from "@/features/gamification/hooks";
import { MissionCard } from "@/features/gamification/components/mission-card";
import { ChevronLeft, Target } from "lucide-react-native";
import { useState } from "react";

type MissionTab = "daily" | "weekly" | "monthly";

export default function MissionsScreen() {
  const router = useRouter();
  const { data: missions, isLoading, isError, error } = useUserMissions();
  const [activeTab, setActiveTab] = useState<MissionTab>("daily");

  const activeMissions =
    activeTab === "daily"
      ? missions?.daily ?? []
      : activeTab === "weekly"
        ? missions?.weekly ?? []
        : missions?.monthly ?? [];

  const completedCount = activeMissions.filter((m) => m.isCompleted).length;
  const totalCount = activeMissions.length;

  console.log("📱 [MissionsScreen] Component state:", {
    isLoading,
    isError,
    error: error?.message,
    hasMissions: !!missions,
    activeTab,
    activeMissions: activeMissions.length,
    missionsData: missions,
  });

  return (
    <Container className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-5 pt-4 pb-3 bg-white flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
        >
          <ChevronLeft size={24} color="#364153" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900 ml-3">Missões</Text>
      </View>

      {/* Header Stats */}
      <View className="bg-primary px-5 py-6">
        <View className="flex-row items-center gap-3 mb-2">
          <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
            <Target size={24} color="#fff" strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              Suas Missões {activeTab === "daily" ? "Diárias" : activeTab === "weekly" ? "Semanais" : "Mensais"}
            </Text>
            <Text className="text-white/80 text-sm">
              {completedCount} de {totalCount} completadas
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <View className="mt-3">
            <View className="h-2 bg-white/20 rounded-full overflow-hidden">
              <View
                className="h-full bg-white"
                style={{
                  width: `${(completedCount / totalCount) * 100}%`,
                }}
              />
            </View>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === "daily" ? "border-primary" : "border-transparent"}`}
          onPress={() => setActiveTab("daily")}
        >
          <Text
            className={`font-semibold ${activeTab === "daily" ? "text-primary" : "text-gray-600"}`}
          >
            Diárias
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === "weekly" ? "border-primary" : "border-transparent"}`}
          onPress={() => setActiveTab("weekly")}
        >
          <Text
            className={`font-semibold ${activeTab === "weekly" ? "text-primary" : "text-gray-600"}`}
          >
            Semanais
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === "monthly" ? "border-primary" : "border-transparent"}`}
          onPress={() => setActiveTab("monthly")}
        >
          <Text
            className={`font-semibold ${activeTab === "monthly" ? "text-primary" : "text-gray-600"}`}
          >
            Mensais
          </Text>
        </TouchableOpacity>
      </View>

      {/* Missions List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#155DFC" />
          <Text className="text-gray-600 mt-3">Carregando missões...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-5 py-4">
          {activeMissions.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Target size={48} color="#D1D5DB" strokeWidth={1.5} />
              <Text className="text-gray-600 mt-3 text-center">
                Nenhuma missão {activeTab === "daily" ? "diária" : activeTab === "weekly" ? "semanal" : "mensal"}{" "}
                disponível
              </Text>
            </View>
          ) : (
            activeMissions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))
          )}
        </ScrollView>
      )}
    </Container>
  );
}
