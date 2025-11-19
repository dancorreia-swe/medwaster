import { useMemo } from "react";
import {
  ActivityIndicator,
  Text,
  View,
} from "react-native";
import type { ActivityHistoryEntry } from "@/features/gamification/api";

const WEEKDAY_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];
const DEFAULT_WEEKS = 5;

interface StreakCalendarProps {
  activities?: ActivityHistoryEntry[];
  isLoading?: boolean;
  weeks?: number;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7; // Monday as first day
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function StreakCalendar({
  activities = [],
  isLoading,
  weeks = DEFAULT_WEEKS,
}: StreakCalendarProps) {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const calendar = useMemo(() => {
    const activityMap = new Map<string, ActivityHistoryEntry>();
    activities.forEach((activity) => {
      activityMap.set(activity.activityDate, activity);
    });

    const startCurrentWeek = startOfWeek(today);
    const calendarStart = new Date(startCurrentWeek);
    calendarStart.setDate(calendarStart.getDate() - (weeks - 1) * 7);

    const totalDays = weeks * 7;
    const items: Array<{
      key: string;
      label: number;
      isActive: boolean;
      isToday: boolean;
      isFuture: boolean;
    }> = [];

    for (let i = 0; i < totalDays; i++) {
      const current = new Date(calendarStart);
      current.setDate(calendarStart.getDate() + i);
      const key = formatDateKey(current);
      const isFuture = current > today;
      const isToday = key === formatDateKey(today);
      const isActive = Boolean(activityMap.get(key));

      items.push({
        key,
        label: current.getDate(),
        isActive,
        isToday,
        isFuture,
      });
    }

    return items;
  }, [activities, today, weeks]);

  const rows = useMemo(() => {
    const chunked: Array<typeof calendar> = [];
    for (let i = 0; i < calendar.length; i += 7) {
      chunked.push(calendar.slice(i, i + 7));
    }
    return chunked;
  }, [calendar]);

  return (
    <View className="bg-white rounded-2xl border border-gray-200 p-5">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-xs font-semibold text-gray-600 uppercase">
            Calendário da sequência
          </Text>
          <Text className="text-lg font-bold text-gray-900">
            Últimas {weeks} semanas
          </Text>
        </View>
        {isLoading && <ActivityIndicator size="small" color="#155DFC" />}
      </View>

      <View className="flex-row justify-between mb-3">
        {WEEKDAY_LABELS.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            className="flex-1 text-center text-xs font-semibold text-gray-500"
          >
            {label}
          </Text>
        ))}
      </View>

      <View className="gap-2">
        {rows.map((week, index) => (
          <View key={`${index}`} className="flex-row gap-2">
            {week.map((day) => {
              const backgroundClass = day.isActive
                ? "bg-primary/10"
                : day.isFuture
                  ? "bg-transparent"
                  : "bg-gray-50";

              const borderColorClass = day.isFuture
                ? "border-gray-300 border-dashed"
                : day.isActive
                  ? "border-primary/40"
                  : "border-gray-200";

              const textStyles = day.isActive
                ? "text-primary"
                : day.isFuture
                  ? "text-gray-300"
                  : "text-gray-600";

              const borderClasses = day.isToday
                ? "border-2 border-primary"
                : `border ${borderColorClass}`;

              return (
                <View
                  key={day.key}
                  className={`flex-1 aspect-square rounded-xl items-center justify-center ${backgroundClass} ${borderClasses}`}
                >
                  <Text className={`text-sm font-semibold ${textStyles}`}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View className="flex-row gap-4 mt-6">
        <View className="flex-row items-center gap-2">
          <View className="w-4 h-4 rounded-md bg-primary/20 border border-primary/40" />
          <Text className="text-xs text-gray-600">Dias ativos</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-4 h-4 rounded-md bg-gray-100 border border-gray-200" />
          <Text className="text-xs text-gray-600">Dias livres</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-4 h-4 rounded-md border border-dashed border-gray-300" />
          <Text className="text-xs text-gray-600">Próximos dias</Text>
        </View>
      </View>
    </View>
  );
}
