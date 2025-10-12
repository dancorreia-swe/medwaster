import { Text, TouchableOpacity, View } from "react-native";
import { Clock } from "lucide-react-native";

interface TrailCardProps {
  title: string;
  category: string;
  duration: string;
  gradient: string;
  categoryBg: string;
  status: "new" | "progress";
  progress?: number;
}

export function TrailCard({
  title,
  category,
  duration,
  gradient,
  categoryBg,
  status,
  progress,
}: TrailCardProps) {
  return (
    <View className="bg-white rounded-[12.75px] mr-3.5 fle shadow-sm shadow-black/15">
      {/* Gradient Header */}
      <View className={`h-[140px] rounded-t-[12.75px] p-5 justify-between`}>
        {/* Decorative Blurs */}
        <View className="absolute top-3.5 right-3.5 w-[70px] h-[70px] rounded-full blur-[80px]" />
        <View className="absolute top-7 left-0 w-[112px] h-[112px] rounded-full blur-[128px]" />

        {/* Content */}
        <View>
          <View className="px-[7px] py-[3px] rounded-[6.75px] self-start mb-2">
            <Text className="text-[10.5px] font-medium text-white">
              {category}
            </Text>
          </View>
          <Text className="text-base font-semibold text-white leading-5">
            {title}
          </Text>
        </View>

        {/* Duration */}
        <View className="flex-row items-center gap-[7px]">
          <Clock size={14} color="rgba(255, 255, 255, 0.9)" strokeWidth={1.2} />
          <Text className="text-[12.25px] text-white/90">{duration}</Text>
        </View>
      </View>

      {/* Card Footer */}
      <View className="p-3.5">
        {status === "new" ? (
          <>
            <Text className="text-[12.25px] text-[#6B7280] mb-2.5">
              Protocolos de segurança essenciais
            </Text>
            <TouchableOpacity className="bg-white border border-black/10 rounded-[6.75px] py-1.5 items-center">
              <Text className="text-[12.25px] font-medium text-[#0A0A0A]">
                Começar
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-[12.25px] text-[#6B7280] mb-2.5">
              Procedimentos de emergência
            </Text>
            <View className="mb-[7px]">
              <View className="flex-row justify-between mb-[7px]">
                <Text className="text-[10.5px] text-[#6B7280]">Progresso</Text>
                <Text className="text-[10.5px] font-medium text-[#155DFC]">
                  {progress}%
                </Text>
              </View>
              <View className="h-[5.25px] bg-[#0066CC]/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-[#0066CC] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}
