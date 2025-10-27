export type AchievementFormData = {
  name: string;
  description: string;
  category: string;
  difficulty: string;
  status: string;
  triggerType: string;
  
  // Structured trigger fields
  targetCount?: number;
  targetResourceId?: string;
  targetAccuracy?: number;
  targetTimeSeconds?: number;
  targetStreakDays?: number;
  requirePerfectScore?: boolean;
  requireSequential?: boolean;
  
  // Badge fields
  badgeIcon: string;
  badgeColor: string;
  badgeImageUrl?: string;
  badgeSvg?: string;
  
  // Other fields
  customMessage?: string;
  displayOrder: number;
  isSecret: boolean;
};
