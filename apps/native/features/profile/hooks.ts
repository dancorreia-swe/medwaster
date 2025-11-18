import { useQuery } from "@tanstack/react-query";
import { fetchProfileStats } from "./api";

export function useProfileStats() {
  return useQuery({
    queryKey: ["profile", "stats"],
    queryFn: fetchProfileStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
