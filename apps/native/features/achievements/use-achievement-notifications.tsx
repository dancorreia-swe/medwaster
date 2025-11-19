import { useEffect, useRef } from "react";
import { client } from "@/lib/eden";
import { AppState, View, Text, Image } from "react-native";
import type { AppStateStatus } from "react-native";
import { toast } from "sonner-native";
import { Icon } from "@/components/icon";
import { getLucideIcon } from "./utils";
import { useRouter } from "expo-router";

/**
 * Hook to check for unnotified achievements and show notifications
 * Checks when:
 * - App comes to foreground
 * - Component first mounts
 * - On manual trigger
 */
export function useAchievementNotifications() {
  const isCheckingRef = useRef(false);
  const router = useRouter();

  const checkForUnnotifiedAchievements = async () => {
    // Prevent duplicate checks
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      // Get achievements that were unlocked but NOT yet notified
      const response = await client.achievements.unnotified.get();

      if (!response.data || response.data.success !== true) {
        return;
      }

      const unnotified = response.data.data;

      console.log(`📬 Found ${unnotified.length} unnotified achievements`);

      // Show notifications for unnotified achievements (one at a time with delay)
      unnotified.forEach((ua, index) => {
        setTimeout(async () => {
          const IconComponent = getLucideIcon(ua.achievement.badgeIcon || "trophy");
          const badgeColor = ua.achievement.badgeColor || "#fbbf24";

          toast.custom(
              <View className="bg-white rounded-2xl shadow-2xl border-2 border-green-500 p-4 mx-4">
                <View className="flex-row items-center">
                  {/* Icon */}
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mr-4"
                    style={{ backgroundColor: `${badgeColor}20` }}
                  >
                    <Icon icon={IconComponent} size={28} color={badgeColor} />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1 gap-1">
                      <Image 
                        source={require("@/assets/medal.png")}
                        style={{ width: 16, height: 16 }}
                        resizeMode="contain"
                      />
                      <Text className="text-xs font-bold text-green-600 uppercase tracking-wide">
                        CONQUISTA DESBLOQUEADA!
                      </Text>
                    </View>
                    <Text className="text-base font-bold text-gray-900 mb-1">
                      {ua.achievement.name}
                    </Text>
                    <Text className="text-sm text-gray-600" numberOfLines={1}>
                      {ua.achievement.description}
                    </Text>
                  </View>

                  {/* Sparkle */}
                  <View className="ml-2">
                    <Text className="text-2xl">✨</Text>
                  </View>
                </View>
              </View>,
            {
              duration: 4000,
              onDismiss: () => {
                router.push("/(app)/(tabs)/(profile)/achievements");
              },
            }
          );

          // Mark as notified in backend
          try {
            await client.achievements["mark-notified"][ua.achievementId].post();
            console.log(`✅ Marked achievement ${ua.achievementId} as notified`);
          } catch (error) {
            console.error(`❌ Failed to mark achievement as notified:`, error);
          }
        }, index * 5000); // Stagger by 5 seconds
      });
    } catch (error) {
      console.error("Error checking unnotified achievements:", error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    // Check on mount
    checkForUnnotifiedAchievements();

    // Check when app comes to foreground
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkForUnnotifiedAchievements();
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    checkForUnnotifiedAchievements,
  };
}
