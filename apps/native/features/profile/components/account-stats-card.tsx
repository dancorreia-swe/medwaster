import { View, Text } from "react-native";
import { Calendar, LogIn, ShieldCheck, Link } from "lucide-react-native";
import { Icon } from "@/components/icon";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccountStats {
  accountCreatedAt: Date;
  firstLoginAt: Date | null;
  lastActivityAt: Date | null;
  emailVerified: boolean;
  hasPassword: boolean;
  connectedAccounts: Array<{
    provider: string;
    accountId: string;
    connectedAt: Date;
  }>;
}

interface AccountStatsCardProps {
  stats: AccountStats;
}

export function AccountStatsCard({ stats }: AccountStatsCardProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "Nunca";
    try {
      return format(new Date(date), "d 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getProviderName = (provider: string) => {
    const providers: Record<string, string> = {
      google: "Google",
      facebook: "Facebook",
      github: "GitHub",
      twitter: "Twitter",
    };
    return providers[provider] || provider;
  };

  return (
    <View className="bg-white dark:bg-gray-900 rounded-2xl p-5 gap-4">
      <Text className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">
        Informações da conta
      </Text>

      {/* Account Created */}
      <View className="flex-row items-start gap-3">
        <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center">
          <Icon icon={Calendar} size={18} className="text-blue-600 dark:text-blue-400" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Conta criada
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-0.5">
            {formatDate(stats.accountCreatedAt)}
          </Text>
        </View>
      </View>

      {/* First Login */}
      {stats.firstLoginAt && (
        <View className="flex-row items-start gap-3">
          <View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center">
            <Icon icon={LogIn} size={18} className="text-green-600 dark:text-green-400" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-50">
              Primeiro acesso
            </Text>
            <Text className="text-base text-gray-500 dark:text-gray-400 mt-0.5">
              {formatDate(stats.firstLoginAt)}
            </Text>
          </View>
        </View>
      )}

      {/* Email Verified */}
      <View className="flex-row items-start gap-3">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${
            stats.emailVerified
              ? "bg-green-100 dark:bg-green-900/30"
              : "bg-yellow-100 dark:bg-yellow-900/30"
          }`}
        >
          <Icon
            icon={ShieldCheck}
            size={18}
            className={
              stats.emailVerified
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            }
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-gray-50">
            Verificação de email
          </Text>
          <Text
            className={`text-base mt-0.5 ${
              stats.emailVerified
                ? "text-green-600 dark:text-green-400"
                : "text-yellow-600 dark:text-yellow-400"
            }`}
          >
            {stats.emailVerified ? "Verificado" : "Não verificado"}
          </Text>
        </View>
      </View>

      {/* Connected Accounts */}
      {stats.connectedAccounts.length > 0 && (
        <View className="flex-row items-start gap-3">
          <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center">
            <Icon icon={Link} size={18} className="text-purple-600 dark:text-purple-400" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-1">
              Contas conectadas
            </Text>
            {stats.connectedAccounts.map((account, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800"
              >
                <Text className="text-base text-gray-700 dark:text-gray-300">
                  {getProviderName(account.provider)}
                </Text>
                <Text className="text-base text-gray-500 dark:text-gray-400">
                  {format(new Date(account.connectedAt), "d MMM yyyy", { locale: ptBR })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Authentication Methods */}
      <View className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Text className="text-base font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Métodos de autenticação
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {stats.hasPassword && (
            <View className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full">
              <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                Senha
              </Text>
            </View>
          )}
          {stats.connectedAccounts.map((account, index) => (
            <View
              key={index}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"
            >
              <Text className="text-base font-medium text-gray-700 dark:text-gray-300">
                {getProviderName(account.provider)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
