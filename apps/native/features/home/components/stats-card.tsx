import { Text, TouchableOpacity, View } from "react-native";
import { Flame, ChevronRight } from "lucide-react-native";

interface StatsCardProps {
  streak: number;
  keyPoints: number;
  minutes: number;
  modules: number;
}

export function StatsCard({
  streak,
  keyPoints,
  minutes,
  modules,
}: StatsCardProps) {
  return (
    <View className="mx-5 mb-3.5 bg-white rounded-[12.75px] p-6 shadow-sm">
      <View className="flex-row justify-between mb-3.5">
        {/* Streak */}
        <View className="items-center gap-1">
          <View className="flex-row items-center gap-1">
            <Flame size={18} color="#FF6900" strokeWidth={1.5} />
            <Text className="text-[21px] font-semibold text-[#0A0A0A]">
              {streak}
            </Text>
          </View>
          <Text className="text-[10.5px] text-[#6B7280] text-center">dia</Text>
        </View>

        {/* Key Points */}
        <View className="items-center gap-0">
          <Text className="text-[21px] font-semibold text-[#155DFC]">
            {keyPoints}
          </Text>
          <Text className="text-[10.5px] text-[#6B7280] text-center leading-7">
            pontos-chave
          </Text>
        </View>

        {/* Minutes */}
        <View className="items-center gap-0">
          <Text className="text-[21px] font-semibold text-[#00A63E]">
            {minutes}
          </Text>
          <Text className="text-[10.5px] text-[#6B7280] text-center">
            minutos
          </Text>
        </View>

        {/* Modules */}
        <View className="items-center gap-0">
          <Text className="text-[21px] font-semibold text-[#9810FA]">
            {modules}
          </Text>
          <Text className="text-[10.5px] text-[#6B7280] text-center">
            módulos
          </Text>
        </View>
      </View>

      {/* Daily Mission Button */}
      <TouchableOpacity className="bg-primary rounded-[12.75px] py-3 flex-row items-center justify-center shadow-sm">
        <Text className="text-white text-[12.25px] font-medium tracking-tight">
          SUA MISSÃO DIÁRIA
        </Text>
        <ChevronRight size={14} color="#FFFFFF" className="ml-1" />
      </TouchableOpacity>
    </View>
  );
}
