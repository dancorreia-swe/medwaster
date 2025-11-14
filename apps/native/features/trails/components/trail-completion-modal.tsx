import { Modal, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Trophy, Clock, Target, Award, ChevronRight, X } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface TrailCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  trail: {
    name: string;
    difficulty: string;
  };
  stats: {
    score: number;
    isPassed: boolean;
    timeSpentMinutes: number;
    completedContent: number;
    totalContent: number;
    earnedPoints?: number;
  };
  onViewCertificate?: () => void;
  onNextTrail?: () => void;
}

export function TrailCompletionModal({
  visible,
  onClose,
  trail,
  stats,
  onViewCertificate,
  onNextTrail,
}: TrailCompletionModalProps) {
  const { score, isPassed, timeSpentMinutes, completedContent, totalContent, earnedPoints } = stats;

  // Format time display
  const hours = Math.floor(timeSpentMinutes / 60);
  const minutes = timeSpentMinutes % 60;
  const timeDisplay = hours > 0
    ? `${hours}h ${minutes}min`
    : `${minutes} min`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header with Gradient */}
            <LinearGradient
              colors={isPassed ? ["#10B981", "#059669"] : ["#F59E0B", "#D97706"]}
              className="px-6 pt-12 pb-8 rounded-t-3xl relative"
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full items-center justify-center"
              >
                <X size={24} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>

              {/* Trophy Icon */}
              <View className="items-center mb-6">
                <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-4">
                  <Trophy size={56} color="#FFFFFF" strokeWidth={2} />
                </View>
                <Text className="text-3xl font-bold text-white text-center mb-2">
                  {isPassed ? "Parabéns!" : "Trilha Concluída!"}
                </Text>
                <Text className="text-lg text-white/90 text-center">
                  {isPassed
                    ? "Você concluiu a trilha com sucesso!"
                    : "Você completou todos os módulos!"}
                </Text>
              </View>

              {/* Trail Name */}
              <View className="bg-white/20 rounded-2xl px-5 py-4">
                <Text className="text-sm text-white/80 mb-1 uppercase tracking-wide">
                  Trilha Concluída
                </Text>
                <Text className="text-xl font-bold text-white">
                  {trail.name}
                </Text>
              </View>
            </LinearGradient>

            {/* Stats Section */}
            <View className="px-6 py-8">
              <Text className="text-xl font-bold text-gray-900 mb-6">
                Seu Desempenho
              </Text>

              {/* Stats Grid */}
              <View className="gap-4 mb-8">
                {/* Score */}
                <View className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-5 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-4">
                    <View className="w-14 h-14 bg-blue-500 rounded-full items-center justify-center">
                      <Target size={28} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text className="text-sm text-blue-600 font-semibold mb-1">
                        Pontuação Final
                      </Text>
                      <Text className="text-3xl font-bold text-blue-900">
                        {score}%
                      </Text>
                    </View>
                  </View>
                  {isPassed && (
                    <View className="bg-green-500 px-4 py-2 rounded-full">
                      <Text className="text-white text-xs font-bold">APROVADO</Text>
                    </View>
                  )}
                </View>

                {/* Time Spent */}
                <View className="bg-purple-50 rounded-2xl p-5 flex-row items-center gap-4">
                  <View className="w-14 h-14 bg-purple-500 rounded-full items-center justify-center">
                    <Clock size={28} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text className="text-sm text-purple-600 font-semibold mb-1">
                      Tempo Investido
                    </Text>
                    <Text className="text-2xl font-bold text-purple-900">
                      {timeDisplay}
                    </Text>
                  </View>
                </View>

                {/* Points Earned */}
                {earnedPoints !== undefined && earnedPoints > 0 && (
                  <View className="bg-amber-50 rounded-2xl p-5 flex-row items-center gap-4">
                    <View className="w-14 h-14 bg-amber-500 rounded-full items-center justify-center">
                      <Award size={28} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <View>
                      <Text className="text-sm text-amber-600 font-semibold mb-1">
                        Pontos Conquistados
                      </Text>
                      <Text className="text-2xl font-bold text-amber-900">
                        +{earnedPoints} pontos
                      </Text>
                    </View>
                  </View>
                )}

                {/* Completion Rate */}
                <View className="bg-green-50 rounded-2xl p-5 flex-row items-center gap-4">
                  <View className="w-14 h-14 bg-green-500 rounded-full items-center justify-center">
                    <Text className="text-2xl">✓</Text>
                  </View>
                  <View>
                    <Text className="text-sm text-green-600 font-semibold mb-1">
                      Módulos Concluídos
                    </Text>
                    <Text className="text-2xl font-bold text-green-900">
                      {completedContent}/{totalContent}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View className="gap-3">
                {/* Certificate Button (if passed) */}
                {isPassed && onViewCertificate && (
                  <TouchableOpacity
                    onPress={onViewCertificate}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-full py-4 px-6 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center gap-3">
                      <Award size={24} color="#FFFFFF" strokeWidth={2.5} />
                      <Text className="text-white text-base font-bold">
                        Ver Certificado
                      </Text>
                    </View>
                    <ChevronRight size={24} color="#FFFFFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}

                {/* Next Trail Button */}
                {onNextTrail && (
                  <TouchableOpacity
                    onPress={onNextTrail}
                    className="bg-white border-2 border-blue-600 rounded-full py-4 px-6 flex-row items-center justify-center gap-2"
                  >
                    <Text className="text-blue-600 text-base font-bold">
                      Próxima Trilha
                    </Text>
                    <ChevronRight size={20} color="#3B82F6" strokeWidth={2.5} />
                  </TouchableOpacity>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  onPress={onClose}
                  className="py-4 items-center"
                >
                  <Text className="text-gray-600 text-base font-semibold">
                    Voltar para Trilhas
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
