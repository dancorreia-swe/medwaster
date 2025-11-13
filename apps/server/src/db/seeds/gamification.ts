import { db } from "..";
import { missions, streakMilestones } from "../schema/gamification";
import { eq } from "drizzle-orm";

export async function gamificationSeed() {
  console.log("🎮 Seeding gamification data...");

  // Seed streak milestones
  console.log("  → Creating streak milestones...");

  const existingMilestones = await db.query.streakMilestones.findMany();

  if (existingMilestones.length === 0) {
    await db.insert(streakMilestones).values([
      {
        days: 3,
        title: "Iniciante Dedicado",
        description: "Manteve 3 dias de sequência consecutivos",
        freezeReward: 1,
      },
      {
        days: 7,
        title: "Uma Semana Forte",
        description: "Completou 7 dias consecutivos de estudos",
        freezeReward: 2,
      },
      {
        days: 14,
        title: "Duas Semanas de Sucesso",
        description: "14 dias de dedicação contínua",
        freezeReward: 3,
      },
      {
        days: 30,
        title: "Campeão Mensal",
        description: "30 dias de compromisso com seus estudos",
        freezeReward: 5,
      },
      {
        days: 60,
        title: "Mestre da Consistência",
        description: "60 dias de aprendizado ininterrupto",
        freezeReward: 8,
      },
      {
        days: 100,
        title: "Lenda do Conhecimento",
        description: "100 dias de sequência - uma conquista impressionante!",
        freezeReward: 15,
      },
    ]);
    console.log("    ✓ Created 6 streak milestones");
  } else {
    console.log("    ✓ Streak milestones already exist");
  }

  // Seed daily missions
  console.log("  → Creating daily missions...");

  const dailyMissions = [
    {
      title: "Responda 3 Perguntas",
      description: "Complete 3 perguntas hoje para testar seus conhecimentos",
      type: "complete_questions" as const,
      frequency: "daily" as const,
      targetValue: 3,
      status: "active" as const,
    },
    {
      title: "Leia 1 Artigo",
      description: "Leia pelo menos 1 artigo da wiki hoje",
      type: "read_article" as const,
      frequency: "daily" as const,
      targetValue: 1,
      status: "active" as const,
    },
    {
      title: "Estude 15 Minutos",
      description: "Dedique pelo menos 15 minutos aos seus estudos",
      type: "spend_time_learning" as const,
      frequency: "daily" as const,
      targetValue: 15,
      status: "active" as const,
    },
    {
      title: "Login Diário",
      description: "Faça login todos os dias para manter sua sequência",
      type: "login_daily" as const,
      frequency: "daily" as const,
      targetValue: 1,
      status: "active" as const,
    },
  ];

  for (const mission of dailyMissions) {
    const existing = await db.query.missions.findFirst({
      where: eq(missions.title, mission.title),
    });

    if (!existing) {
      await db.insert(missions).values(mission);
    }
  }
  console.log(`    ✓ Created ${dailyMissions.length} daily missions`);

  // Seed weekly missions
  console.log("  → Creating weekly missions...");

  const weeklyMissions = [
    {
      title: "Responda 15 Perguntas",
      description: "Complete 15 perguntas durante a semana",
      type: "complete_questions" as const,
      frequency: "weekly" as const,
      targetValue: 15,
      status: "active" as const,
    },
    {
      title: "Complete 2 Quizzes",
      description: "Finalize 2 quizzes completos nesta semana",
      type: "complete_quiz" as const,
      frequency: "weekly" as const,
      targetValue: 2,
      status: "active" as const,
    },
    {
      title: "Leia 5 Artigos",
      description: "Leia 5 artigos da wiki durante a semana",
      type: "read_article" as const,
      frequency: "weekly" as const,
      targetValue: 5,
      status: "active" as const,
    },
    {
      title: "Complete 3 Trilhas",
      description: "Finalize 3 conteúdos de trilhas esta semana",
      type: "complete_trail_content" as const,
      frequency: "weekly" as const,
      targetValue: 3,
      status: "active" as const,
    },
    {
      title: "Mantenha sua Sequência",
      description: "Mantenha 7 dias de sequência consecutivos",
      type: "complete_streak" as const,
      frequency: "weekly" as const,
      targetValue: 7,
      status: "active" as const,
    },
  ];

  for (const mission of weeklyMissions) {
    const existing = await db.query.missions.findFirst({
      where: eq(missions.title, mission.title),
    });

    if (!existing) {
      await db.insert(missions).values(mission);
    }
  }
  console.log(`    ✓ Created ${weeklyMissions.length} weekly missions`);

  // Seed monthly missions
  console.log("  → Creating monthly missions...");

  const monthlyMissions = [
    {
      title: "Mestre das Perguntas",
      description: "Responda 100 perguntas durante o mês",
      type: "complete_questions" as const,
      frequency: "monthly" as const,
      targetValue: 100,
      status: "active" as const,
    },
    {
      title: "Expert em Quizzes",
      description: "Complete 10 quizzes este mês",
      type: "complete_quiz" as const,
      frequency: "monthly" as const,
      targetValue: 10,
      status: "active" as const,
    },
    {
      title: "Leitor Voraz",
      description: "Leia 20 artigos da wiki durante o mês",
      type: "read_article" as const,
      frequency: "monthly" as const,
      targetValue: 20,
      status: "active" as const,
    },
    {
      title: "Estudante Dedicado",
      description: "Estude por 10 horas durante o mês",
      type: "spend_time_learning" as const,
      frequency: "monthly" as const,
      targetValue: 600, // 10 hours in minutes
      status: "active" as const,
    },
    {
      title: "Sequência de Ouro",
      description: "Mantenha 30 dias de sequência consecutivos",
      type: "complete_streak" as const,
      frequency: "monthly" as const,
      targetValue: 30,
      status: "active" as const,
    },
  ];

  for (const mission of monthlyMissions) {
    const existing = await db.query.missions.findFirst({
      where: eq(missions.title, mission.title),
    });

    if (!existing) {
      await db.insert(missions).values(mission);
    }
  }
  console.log(`    ✓ Created ${monthlyMissions.length} monthly missions`);

  console.log("  ✓ Gamification seeding complete!");
}
