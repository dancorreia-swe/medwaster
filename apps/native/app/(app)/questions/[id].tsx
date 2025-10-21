import { Container } from "@/components/container";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Check, X } from "lucide-react-native";
import { useState, useEffect } from "react";

// Mock data - Replace with actual data from API
const questionsData = {
  "3": {
    id: "3",
    type: "true-false",
    question:
      "Resíduos da Classe A (biológicos) devem ser descartados em sacos brancos leitosos?",
    correctAnswer: true,
    explanation:
      "Sim! De acordo com a RDC 222/2018 da ANVISA, resíduos do Grupo A (biológicos) devem ser acondicionados em sacos brancos leitosos, que são identificados com o símbolo de substância infectante.",
    trailId: "1",
  },
};

export default function QuestionDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  const question = questionsData[id as keyof typeof questionsData];

  if (!question) {
    return (
      <Container className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-600">Questão não encontrada</Text>
      </Container>
    );
  }

  const handleAnswerSelect = (answer: boolean) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
  };

  const handleContinue = () => {
    const isCorrect = selectedAnswer === question.correctAnswer;
    // Navigate back with unlock-next param if answer is correct
    if (isCorrect) {
      router.push(`/(app)/(tabs)/trails/${question.trailId}?unlock-next=true` as any);
    } else {
      router.push(`/(app)/(tabs)/trails/${question.trailId}` as any);
    }
  };

  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <Container className="flex-1 bg-white">
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center mb-8 mt-1"
          >
            <ChevronLeft size={24} color="#364153" strokeWidth={2} />
          </TouchableOpacity>

          <Text className="text-primary text-2xl font-bold tracking-wide text-center">
            Verdadeiro ou Falso
          </Text>
        </View>

        {/* Question Content */}
        <View className="flex-1 px-6 justify-between pb-8">
          {/* Question Text */}
          <View className="flex-1 justify-center py-8">
            <Text className="text-gray-900 text-2xl font-bold leading-relaxed text-center px-4">
              {question.question}
            </Text>
          </View>

          {/* Result Explanation - Shows after answering */}
          {showResult && (
            <View
              className={`mx-4 mb-8 p-6 rounded-3xl ${
                isCorrect ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <View className="flex-row items-center mb-3">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                    isCorrect ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {isCorrect ? (
                    <Check size={20} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <X size={20} color="#FFFFFF" strokeWidth={3} />
                  )}
                </View>
                <Text
                  className={`text-lg font-bold ${
                    isCorrect ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {isCorrect ? "Correto!" : "Incorreto"}
                </Text>
              </View>
              <Text
                className={`text-base leading-relaxed ${
                  isCorrect ? "text-green-800" : "text-red-800"
                }`}
              >
                {question.explanation}
              </Text>
            </View>
          )}

          {/* Answer Buttons - Side by Side with Icons */}
          <View className="flex-row gap-4 px-4">
            {/* Falso Button - Red */}
            <TouchableOpacity
              onPress={() => handleAnswerSelect(false)}
              disabled={showResult}
              className={`flex-1 rounded-3xl py-8 items-center justify-center border-2 ${
                selectedAnswer === false
                  ? showResult
                    ? isCorrect
                      ? "bg-green-500/20 border-green-500"
                      : "bg-red-500/20 border-red-500"
                    : "bg-red-500/20 border-red-500"
                  : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <X 
                size={48} 
                color={selectedAnswer === false ? "#EF4444" : "#EF4444"} 
                strokeWidth={3}
              />
              <Text className="text-red-600 text-lg font-bold mt-2">
                Falso
              </Text>
            </TouchableOpacity>

            {/* Verdadeiro Button - Green */}
            <TouchableOpacity
              onPress={() => handleAnswerSelect(true)}
              disabled={showResult}
              className={`flex-1 rounded-3xl py-8 items-center justify-center border-2 ${
                selectedAnswer === true
                  ? showResult
                    ? isCorrect
                      ? "bg-green-500/20 border-green-500"
                      : "bg-red-500/20 border-red-500"
                    : "bg-green-500/20 border-green-500"
                  : "bg-green-500/10 border-green-500/30"
              }`}
            >
              <Check 
                size={48} 
                color={selectedAnswer === true ? "#22C55E" : "#22C55E"} 
                strokeWidth={3}
              />
              <Text className="text-green-600 text-lg font-bold mt-2">
                Verdadeiro
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit/Continue Button */}
          <View className="mt-6">
            {!showResult ? (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={selectedAnswer === null}
                className={`rounded-full py-5 items-center ${
                  selectedAnswer === null
                    ? "bg-gray-300"
                    : "bg-primary"
                }`}
              >
                <Text
                  className={`text-lg font-bold ${
                    selectedAnswer === null ? "text-gray-500" : "text-white"
                  }`}
                >
                  Confirmar Resposta
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleContinue}
                className="bg-primary rounded-full py-5 items-center"
              >
                <Text className="text-white text-lg font-bold">
                  Continuar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
