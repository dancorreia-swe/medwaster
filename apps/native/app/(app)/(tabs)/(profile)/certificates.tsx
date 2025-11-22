import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Linking,
  Alert,
  Image,
} from "react-native";
import { Container } from "@/components/container";
import {
  useUserCertificate,
  getCertificateDownloadUrl,
} from "@/features/certificates/api";
import {
  Award,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Share2,
  Download,
} from "lucide-react-native";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useColorScheme } from "@/lib/use-color-scheme";
import { url } from "better-auth";

export default function CertificatesScreen() {
  const router = useRouter();
  const { isDarkColorScheme } = useColorScheme();
  const { data, isLoading } = useUserCertificate();
  const { data: session } = authClient.useSession();
  const certificate = data?.certificate;
  const [downloading, setDownloading] = useState(false);
  const chevronColor = isDarkColorScheme ? "#E5E7EB" : "#364153";

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
      const rawUrl = certificate.certificateUrl;
      const pdfUrl = rawUrl
        ? rawUrl.startsWith("http")
          ? rawUrl
          : `${serverUrl}${rawUrl}`
        : undefined;

      const baseMessage = `🎓 Conquistei meu Certificado de Conclusão no MedWaster!\n\n${certificate.totalTrailsCompleted} trilhas • ${certificate.averageScore.toFixed(1)}% de média\n\nCódigo: ${certificate.verificationCode}`;

      const shareMessage = pdfUrl
        ? `${baseMessage}\n\nBaixar certificado: ${pdfUrl}`
        : baseMessage;

      await Share.share({
        title: "Meu certificado MedWaster",
        url: pdfUrl,
        message: shareMessage,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (isLoading) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#155DFC" />
        </View>
      </Container>
    );
  }

  // No certificate yet
  if (!certificate) {
    return (
      <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
        {/* Header with Back Button */}
        <View className="px-5 pt-4 pb-4 bg-white flex-row items-center border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center dark:border-gray-800 dark:bg-gray-900"
          >
            <ChevronLeft size={24} color={chevronColor} strokeWidth={2} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-gray-50 ml-3">
            Certificado
          </Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-8">
            {/* Empty State */}
            <View className="bg-white rounded-3xl p-12 items-center dark:bg-gray-900">
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6 dark:bg-gray-800">
                <Award size={48} color="#9CA3AF" strokeWidth={2} />
              </View>

              <Text className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-3 text-center">
                Certificado Bloqueado
              </Text>

              <Text className="text-base text-gray-600 dark:text-gray-400 text-center">
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

  const statusContent = {
    pending: {
      badgeLabel: "Em revisão",
      badgeBg:
        "border-yellow-200 bg-yellow-50 dark:border-yellow-500/50 dark:bg-yellow-900/30",
      badgeText: "text-yellow-900 dark:text-yellow-100",
      heroTitle: "Estamos revisando seu certificado",
      heroDescription:
        "Nossa equipe confere suas trilhas e notas. Isso pode levar até 2 dias úteis.",
      heroBgClass: "bg-yellow-500 dark:bg-yellow-600",
      description:
        "Assim que tudo estiver validado enviaremos uma notificação e você poderá baixar o documento.",
    },
    approved: {
      badgeLabel: "Certificado liberado",
      badgeBg:
        "border-blue-200 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-900/30",
      badgeText: "text-blue-900 dark:text-blue-100",
      heroTitle: "Parabéns! Seu certificado foi aprovado",
      heroDescription: "Faça o download em PDF e compartilhe com seu time.",
      heroBgClass: "bg-blue-600 dark:bg-blue-500",
      description:
        "Você já pode baixar o documento oficialmente reconhecido e divulgar suas conquistas.",
    },
    rejected: {
      badgeLabel: "Ajustes necessários",
      badgeBg:
        "border-red-200 bg-red-50 dark:border-red-500/40 dark:bg-red-900/30",
      badgeText: "text-red-900 dark:text-red-100",
      heroTitle: "Precisamos de algumas correções",
      heroDescription:
        "Revise o feedback e envie novamente para nova avaliação.",
      heroBgClass: "bg-red-600 dark:bg-red-500",
      description:
        "Se tiver dúvidas sobre o que precisa ser corrigido, consulte o motivo indicado abaixo.",
    },
  } as const;

  const currentStatus =
    statusContent[certificate.status as keyof typeof statusContent] ??
    statusContent.pending;

  return (
    <Container className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Header with Back Button */}
      <View className="px-5 pt-4 pb-4 bg-white flex-row items-center border-b border-gray-100 dark:bg-gray-900 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-11 h-11 rounded-xl border border-gray-200 items-center justify-center dark:border-gray-800 dark:bg-gray-900"
        >
          <ChevronLeft size={24} color={chevronColor} strokeWidth={2} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-gray-50 ml-3">
          Certificado
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          <View className="mb-4">
            <View
              className={`self-start rounded-full px-4 py-1 border ${currentStatus.badgeBg}`}
            >
              <Text
                className={`text-xs font-semibold uppercase tracking-wider ${currentStatus.badgeText}`}
              >
                {currentStatus.badgeLabel}
              </Text>
            </View>
          </View>

          <View
            className={`rounded-3xl overflow-hidden mb-6 ${currentStatus.heroBgClass}`}
          >
            <View className="flex-row items-center px-5 py-6 gap-4">
              <Image
                source={require("@/assets/graduation.png")}
                style={{ width: 88, height: 88 }}
                resizeMode="contain"
              />
              <View className="flex-1">
                <Text className="text-white text-xl font-semibold mb-1">
                  {currentStatus.heroTitle}
                </Text>
                <Text className="text-white/90 text-sm leading-relaxed">
                  {currentStatus.heroDescription}
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-base text-gray-600 dark:text-gray-400 mb-8">
            {currentStatus.description}
          </Text>

          {/* Status Banner */}
          {isPending && (
            <View className="bg-yellow-50 rounded-2xl p-5 mb-6 flex-row items-center gap-3 dark:bg-yellow-900/30">
              <Clock size={22} color="#F59E0B" strokeWidth={2.5} />
              <Text className="flex-1 text-base text-yellow-800 dark:text-yellow-100">
                Em análise pela equipe
              </Text>
            </View>
          )}

          {isRejected && certificate.reviewNotes && (
            <View className="bg-red-50 rounded-2xl p-5 mb-6 dark:bg-red-900/30">
              <Text className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
                Motivo da rejeição
              </Text>
              <Text className="text-base text-red-700 dark:text-red-200">
                {certificate.reviewNotes}
              </Text>
            </View>
          )}

          {isApproved && (
            <View className="bg-green-50 rounded-2xl p-5 mb-6 flex-row items-center gap-3 dark:bg-green-900/30">
              <CheckCircle2 size={22} color="#10B981" strokeWidth={2.5} />
              <Text className="flex-1 text-base text-green-800 dark:text-green-100">
                Aprovado em {formatDate(certificate.reviewedAt)}
              </Text>
            </View>
          )}

          {/* Certificate Card */}
          <View className="bg-white rounded-3xl p-10 mb-6 dark:bg-gray-900">
            {/* Header */}
            <View className="items-center mb-10 pb-8 border-b border-gray-100 dark:border-gray-800">
              <View className="w-20 h-20 bg-blue-50 rounded-full items-center justify-center mb-4 dark:bg-blue-900/30">
                <Award size={40} color="#155DFC" strokeWidth={2.5} />
              </View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50 text-center mb-2">
                Certificado de Conclusão
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-400 text-center">
                MedWaster
              </Text>
            </View>

            {/* Student Name */}
            <View className="mb-8">
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Certificamos que
              </Text>
              <Text className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                {session?.user?.name || "Estudante"}
              </Text>
            </View>

            {/* Achievement */}
            <Text className="text-base text-gray-700 dark:text-gray-300 mb-10 leading-relaxed">
              concluiu com sucesso todas as trilhas de aprendizado da
              plataforma.
            </Text>

            {/* Stats */}
            <View className="flex-row gap-4 mb-10 pb-8 border-b border-gray-100 dark:border-gray-800">
              <View className="flex-1">
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Média
                </Text>
                <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {certificate.averageScore.toFixed(0)}%
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Trilhas
                </Text>
                <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {certificate.totalTrailsCompleted}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Tempo
                </Text>
                <Text className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {formatTime(certificate.totalTimeMinutes)}
                </Text>
              </View>
            </View>

            {/* Date */}
            <View className="mb-8">
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Concluído em
              </Text>
              <Text className="text-base text-gray-800 dark:text-gray-200">
                {formatDate(certificate.allTrailsCompletedAt)}
              </Text>
            </View>

            {/* Verification Code */}
            <View className="bg-gray-50 rounded-2xl p-5 dark:bg-gray-800">
              <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Código de Verificação
              </Text>
              <Text className="text-base font-mono font-semibold text-gray-900 dark:text-gray-50">
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
                className="bg-white border-2 border-blue-500 rounded-2xl py-5 flex-row items-center justify-center gap-2 dark:bg-gray-900 dark:border-blue-400"
                activeOpacity={0.8}
              >
                <Share2 size={20} color="#155DFC" strokeWidth={2.5} />
                <Text className="text-blue-500 dark:text-blue-200 text-lg font-semibold">
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
