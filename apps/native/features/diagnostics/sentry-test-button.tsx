import { Text, TouchableOpacity, View } from "react-native";
import { Bug } from "lucide-react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { authClient } from "@/lib/auth-client";
import { isSentryEnabled, Sentry } from "@/lib/sentry";

const ADMIN_ROLES = new Set(["admin", "super-admin"]);

/**
 * Admin-only control that sends a test error to Sentry, to verify a release
 * build is reporting. Hidden for regular users.
 */
export function SentryTestButton() {
  const { data: session } = authClient.useSession();
  const role = (session?.user as { role?: string | null } | undefined)?.role;

  if (!role || !ADMIN_ROLES.has(role)) return null;

  const sendTestError = () => {
    if (!isSentryEnabled) {
      toast.info("Sentry desativado nesta build (sem EXPO_PUBLIC_SENTRY_DSN)");
      return;
    }
    const eventId = Sentry.captureException(
      new Error("Sentry test error from the mobile app"),
    );
    toast.success(`Erro de teste enviado (${eventId.slice(0, 8)})`);
  };

  return (
    <View className="px-6 py-4">
      <TouchableOpacity
        onPress={sendTestError}
        className="flex-row items-center gap-3 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-4"
      >
        <Icon icon={Bug} size={20} className="text-gray-600 dark:text-gray-400" />
        <Text className="text-base text-gray-700 dark:text-gray-300">
          Enviar erro de teste (Sentry)
        </Text>
      </TouchableOpacity>
    </View>
  );
}
