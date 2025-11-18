import { useQuery } from "@tanstack/react-query";
import { fetchAchievements } from "./api";

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: fetchAchievements,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
