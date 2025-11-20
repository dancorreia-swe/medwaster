import { Container } from "@/components/container";
import { ScrollView, Text, View, ActivityIndicator, RefreshControl } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { FilterButton, TrailCard } from "@/features/trails/components";
import { useTrails } from "@/features/trails/hooks";

type FilterType = "all" | "in-progress" | "available" | "completed";

export default function Trails() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const router = useRouter();
  const { data: trails, isLoading, isError, refetch, isFetching } = useTrails();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate counts and filter trails
  const getFilteredTrails = () => {
    if (!trails) return [];

    return trails.filter((trail: any) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "in-progress")
        return trail.progress?.isEnrolled && !trail.progress?.isCompleted;
      if (activeFilter === "available")
        return !trail.progress?.isEnrolled && !trail.isLocked;
      if (activeFilter === "completed") return trail.progress?.isCompleted;
      return true;
    });
  };

  const filteredTrails = getFilteredTrails();

  const counts = {
    all: trails?.length || 0,
    inProgress:
      trails?.filter(
        (t: any) => t.progress?.isEnrolled && !t.progress?.isCompleted,
      ).length || 0,
    available:
      trails?.filter((t: any) => !t.progress?.isEnrolled && !t.isLocked)
        .length || 0,
    completed:
      trails?.filter((t: any) => t.progress?.isCompleted).length || 0,
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  return (
    <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header - Fixed at top */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center gap-2.5 py-3 mb-3">
          <Text className="text-4xl font-bold text-gray-900 dark:text-gray-50 leading-tight">
            Trilhas
          </Text>
          <Text className="text-4xl font-light text-gray-400 dark:text-gray-400 leading-tight">
            de Aprendizado
          </Text>
        </View>

        {/* Filter Buttons */}
        <View className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2.5"
          >
            <FilterButton
              label="Todas"
              count={counts.all}
              isActive={activeFilter === "all"}
              onPress={() => setActiveFilter("all")}
              variant="default"
            />
            <FilterButton
              label="Em Progresso"
              count={counts.inProgress}
              isActive={activeFilter === "in-progress"}
              onPress={() => setActiveFilter("in-progress")}
              variant="progress"
            />
            <FilterButton
              label="Disponíveis"
              count={counts.available}
              isActive={activeFilter === "available"}
              onPress={() => setActiveFilter("available")}
              variant="available"
            />
            <FilterButton
              label="Completas"
              count={counts.completed}
              isActive={activeFilter === "completed"}
              onPress={() => setActiveFilter("completed")}
              variant="completed"
            />
          </ScrollView>
        </View>
      </View>

      {/* Trail Cards - Scrollable with pull to refresh */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#155DFC"]}
            tintColor="#155DFC"
          />
        }
      >
        <View className="px-6 pb-6">
          {isLoading ? (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color="#155DFC" />
              <Text className="text-gray-600 dark:text-gray-300 mt-3">
                Carregando trilhas...
              </Text>
            </View>
          ) : isError ? (
            <View className="items-center justify-center py-12">
              <Text className="text-gray-600 dark:text-gray-300 text-center">
                Erro ao carregar trilhas.{"\n"}Tente novamente mais tarde.
              </Text>
            </View>
          ) : filteredTrails.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-gray-600 dark:text-gray-300 text-center">
                Nenhuma trilha encontrada.
              </Text>
            </View>
          ) : (
            filteredTrails.map((trail: any) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                onPress={() => {
                  router.push(`/trails/${trail.id}`);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
