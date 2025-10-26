/**
 * Achievements Module Events
 * Event types and interfaces specific to the achievements module
 */

import type { EventData } from "../events";

export const ACHIEVEMENT_EVENTS = {
  UNLOCKED: "achievement.unlocked",
  PROGRESS: "achievement.progress",
  VIEWED: "achievement.viewed",
  CREATED: "achievement.created",
} as const;

export interface AchievementUnlockedData extends EventData {
  achievementId: number;
  achievementName: string;
  category: string;
  difficulty: string;
  progress: number;
  progressMax: number;
}

export interface AchievementProgressData extends EventData {
  achievementId: number;
  achievementName: string;
  progress: number;
  progressMax: number;
  percentComplete: number;
}

export interface AchievementViewedData extends EventData {
  achievementId: number;
  isUnlocked: boolean;
}

export interface AchievementCreatedData extends EventData {
  achievementId: number;
  achievementName: string;
  category: string;
  triggerType: string;
  createdBy: string;
}

declare module "@events/registry" {
  interface EventRegistry {
    "achievement.unlocked": AchievementUnlockedData;
    "achievement.progress": AchievementProgressData;
    "achievement.viewed": AchievementViewedData;
    "achievement.created": AchievementCreatedData;
  }
}
