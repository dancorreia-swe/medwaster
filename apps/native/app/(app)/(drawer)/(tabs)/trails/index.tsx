import { Container } from "@/components/container";
import { ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { FilterButton, JourneyCard } from "@/features/trails/components";

type FilterType = "all" | "in-progress" | "available" | "completed";

const journeys = [
  {
    id: "1",
    emoji: "💊",
    title: "Descarte de Resíduos Farmacêuticos",
    description:
      "Aprenda técnicas adequadas para descarte seguro de medicamentos",
    status: "in-progress" as const,
    bgColor: "#2B7FFF",
    progress: 67,
  },
  {
    id: "2",
    emoji: "🩹",
    title: "Segurança com Perfurocortantes",
    description: "Protocolos de manuseio e descarte de materiais cortantes",
    status: "available" as const,
    bgColor: "#AD46FF",
    duration: "1.5h",
    modules: 10,
  },
  {
    id: "3",
    emoji: "⚗️",
    title: "Gestão de Resíduos Químicos",
    description: "Identificação e descarte correto de substâncias químicas",
    status: "completed" as const,
    bgColor: "#00C950",
  },
  {
    id: "4",
    emoji: "🦠",
    title: "Resíduos Infectantes",
    description: "Manejo seguro de materiais contaminados biologicamente",
    status: "available" as const,
    bgColor: "#AD46FF",
    duration: "3h",
    modules: 15,
  },
  {
    id: "5",
    emoji: "☢️",
    title: "Resíduos Radioativos",
    description: "Protocolos especiais para materiais com radiação",
    status: "locked" as const,
    bgColor: "#F3F4F6",
  },
  {
    id: "6",
    emoji: "♻️",
    title: "Reciclagem Hospitalar",
    description: "Práticas sustentáveis em ambientes de saúde",
    status: "available" as const,
    bgColor: "#AD46FF",
    duration: "1h",
    modules: 6,
  },
];

export default function Trails() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const router = useRouter();

  const filteredJourneys = journeys.filter((journey) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "in-progress") return journey.status === "in-progress";
    if (activeFilter === "available") return journey.status === "available";
    if (activeFilter === "completed") return journey.status === "completed";
    return true;
  });

  const counts = {
    all: journeys.length,
    inProgress: journeys.filter((j) => j.status === "in-progress").length,
    available: journeys.filter((j) => j.status === "available").length,
    completed: journeys.filter((j) => j.status === "completed").length,
  };

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <View className="flex-row items-center gap-3 py-4 mb-4">
            <Text className="text-4xl font-bold text-gray-900 leading-tight">
              Trilhas
            </Text>
            <Text className="text-4xl font-light text-gray-400 leading-tight">
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

        {/* Journey Cards */}
        <View className="px-6 pb-6">
          {filteredJourneys.map((journey) => (
            <JourneyCard
              key={journey.id}
              emoji={journey.emoji}
              title={journey.title}
              description={journey.description}
              status={journey.status}
              bgColor={journey.bgColor}
              progress={journey.progress}
              duration={journey.duration}
              modules={journey.modules}
              onPress={() => {
                router.push(`/trails/${journey.id}`);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </Container>
  );
}
