import { queryOptions } from "@tanstack/react-query";
import { achievementsApi } from "./achievementsApi";

export const achievementsQueryOptions = () =>
  queryOptions({
    queryKey: ["achievements"],
    queryFn: () => achievementsApi.getAchievements(),
  });

export const achievementQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["achievements", id],
    queryFn: () => achievementsApi.getAchievement(id),
  });
