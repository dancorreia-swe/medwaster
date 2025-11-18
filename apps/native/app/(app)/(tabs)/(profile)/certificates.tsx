import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Share, Linking, Alert } from "react-native";
import { Container } from "@/components/container";
import { useUserCertificate, getCertificateDownloadUrl } from "@/features/certificates/api";
import { Award, CheckCircle2, Clock, ChevronLeft, Share2, Download } from "lucide-react-native";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function CertificatesScreen() {
  const router = useRouter();
  const { data, isLoading } = useUserCertificate();
  const { data: session } = authClient.useSession();
  const certificate = data?.certificate;
  const [downloading, setDownloading] = useState(false);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}min`;
  };

  const handleDownloadPDF = async () => {
    if (!certificate || !certificate.certificateUrl) return;
    
    try {
      setDownloading(true);
      
      // Open PDF in browser (will trigger download)
      const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
      const pdfUrl = `${serverUrl}${certificate.certificateUrl}`;
      
      const canOpen = await Linking.canOpenURL(pdfUrl);
      if (canOpen) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert("Erro", "Não foi possível abrir o PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      Alert.alert("Erro", "Não foi possível baixar o certificado");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!certificate) return;
    
    try {
      const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
      const pdfUrl = certificate.certificateUrl 
        ? `${serverUrl}${certificate.certificateUrl}` 
        : null;

      await Share.share({
        message: `🎓 Conquistei meu Certificado de Conclusão no MedWaster!

${certificate.totalTrailsCompleted} trilhas • ${certificate.averageScore.toFixed(1)}% de média

Código: ${certificate.verificationCode}${pdfUrl ? `\n\nBaixar certificado: ${pdfUrl}` : ""}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (isLoading) {
    return (
      <Container className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#155DFC" />
        </View>
      </Container>
    );
  }

  // No certificate yet
  if (!certificate) {
    return (
      <Container className="flex-1 bg-gray-50">
        {/* Header with Back Button */}
        <View className="px-5 pt-4 pb-4 bg-white flex-row items-center border-b border-gray-100">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
          >
            <ChevronLeft size={24} color="#364153" strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 ml-3">Certificado</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-8">
            <Text className="text-lg text-gray-600 mb-8">
              Complete todas as trilhas para desbloquear
            </Text>

            {/* Empty State */}
            <View className="bg-white rounded-3xl p-12 items-center">
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
                <Award size={48} color="#9CA3AF" strokeWidth={2} />
              </View>
              
              <Text className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Certificado Bloqueado
              </Text>
              
              <Text className="text-base text-gray-600 text-center">
                Complete todas as trilhas para desbloquear seu certificado
              </Text>
            </View>
          </View>
        </ScrollView>
      </Container>
    );
  }

  // Certificate exists
  const isPending = certificate.status === "pending";
  const isApproved = certificate.status === "approved";
  const isRejected = certificate.status === "rejected";

  return (
    <Container className="flex-1 bg-gray-50">
      {/* Header with Back Button */}
      <View className="px-5 pt-4 pb-4 bg-white flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center"
        >
          <ChevronLeft size={24} color="#364153" strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-3">Certificado</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <Text className="text-base text-gray-600 mb-8">
            {isPending && "Aguardando aprovação"}
            {isApproved && "Aprovado"}
            {isRejected && "Rejeitado"}
          </Text>

          {/* Status Banner */}
          {isPending && (
            <View className="bg-yellow-50 rounded-2xl p-5 mb-6 flex-row items-center gap-3">
              <Clock size={22} color="#F59E0B" strokeWidth={2.5} />
              <Text className="flex-1 text-base text-yellow-800">
                Em análise pela equipe
              </Text>
            </View>
          )}

          {isRejected && certificate.reviewNotes && (
            <View className="bg-red-50 rounded-2xl p-5 mb-6">
              <Text className="text-base font-semibold text-red-900 mb-2">
                Motivo da rejeição
              </Text>
              <Text className="text-base text-red-700">{certificate.reviewNotes}</Text>
            </View>
          )}

          {isApproved && (
            <View className="bg-green-50 rounded-2xl p-5 mb-6 flex-row items-center gap-3">
              <CheckCircle2 size={22} color="#10B981" strokeWidth={2.5} />
              <Text className="flex-1 text-base text-green-800">
                Aprovado em {formatDate(certificate.reviewedAt)}
              </Text>
            </View>
          )}

          {/* Certificate Card */}
          <View className="bg-white rounded-3xl p-10 mb-6">
            {/* Header */}
            <View className="items-center mb-10 pb-8 border-b border-gray-100">
              <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4">
                <Award size={40} color="#155DFC" strokeWidth={2.5} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
                Certificado de Conclusão
              </Text>
              <Text className="text-base text-gray-600 text-center">
                MedWaster
              </Text>
            </View>

            {/* Student Name */}
            <View className="mb-8">
              <Text className="text-sm text-gray-600 mb-2 uppercase tracking-wide">
                Certificamos que
              </Text>
              <Text className="text-3xl font-bold text-gray-900">
                {session?.user?.name || "Estudante"}
              </Text>
            </View>

            {/* Achievement */}
            <Text className="text-base text-gray-700 mb-10 leading-relaxed">
              concluiu com sucesso todas as trilhas de aprendizado da plataforma.
            </Text>

            {/* Stats */}
            <View className="flex-row gap-4 mb-10 pb-8 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-2">Média</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {certificate.averageScore.toFixed(0)}%
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-2">Trilhas</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {certificate.totalTrailsCompleted}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-2">Tempo</Text>
                <Text className="text-2xl font-bold text-gray-900">
                  {formatTime(certificate.totalTimeMinutes)}
                </Text>
              </View>
            </View>

            {/* Date */}
            <View className="mb-8">
              <Text className="text-sm text-gray-600 mb-2">Concluído em</Text>
              <Text className="text-base text-gray-800">
                {formatDate(certificate.allTrailsCompletedAt)}
              </Text>
            </View>

            {/* Verification Code */}
            <View className="bg-gray-50 rounded-2xl p-5">
              <Text className="text-sm text-gray-600 mb-2">Código de Verificação</Text>
              <Text className="text-base font-mono font-semibold text-gray-900">
                {certificate.verificationCode}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          {isApproved && (
            <View className="gap-3">
              {/* Download PDF Button */}
              {certificate.certificateUrl && (
                <TouchableOpacity
                  onPress={handleDownloadPDF}
                  disabled={downloading}
                  className="bg-blue-500 rounded-2xl py-5 flex-row items-center justify-center gap-2"
                  activeOpacity={0.8}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Download size={20} color="#FFFFFF" strokeWidth={2.5} />
                      <Text className="text-white text-lg font-semibold">
                        Baixar PDF
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Share Button */}
              <TouchableOpacity
                onPress={handleShare}
                className="bg-white border-2 border-blue-500 rounded-2xl py-5 flex-row items-center justify-center gap-2"
                activeOpacity={0.8}
              >
                <Share2 size={20} color="#155DFC" strokeWidth={2.5} />
                <Text className="text-blue-500 text-lg font-semibold">
                  Compartilhar
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
