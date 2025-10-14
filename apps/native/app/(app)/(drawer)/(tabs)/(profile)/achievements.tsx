import { View, Text, ScrollView } from "react-native";
import { Container } from "@/components/container";

export default function AchievementsScreen() {
  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="pt-[42px] px-5 pb-5">
          <Text className="text-[28px] font-bold text-gray-900">Conquistas</Text>
        </View>

        {/* Achievements content placeholder */}
        <View className="px-5 py-3.5">
          <View className="bg-white border border-gray-100 rounded-xl shadow-sm p-3.5">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              Todas as Conquistas
            </Text>
            <Text className="text-xs text-gray-500">
              Em breve: visualize todas as suas conquistas e progresso aqui.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
