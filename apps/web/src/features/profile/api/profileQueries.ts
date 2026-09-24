import { queryOptions } from "@tanstack/react-query";
import { profileApi } from "./profileApi";

export const profileQueryKeys = {
  all: ["profile"] as const,
  accountStats: () => [...profileQueryKeys.all, "account-stats"] as const,
};

export function accountStatsQueryOptions() {
  return queryOptions({
    queryKey: profileQueryKeys.accountStats(),
    queryFn: () => profileApi.getAccountStats(),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
