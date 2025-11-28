import { db } from "..";
import { achievements } from "../schema/achievements";
import { user } from "../schema/auth";
import { eq } from "drizzle-orm";

export async function achievementsSeed() {
  console.log("🏆 Seeding achievements...");

  // Get or create system user
  let systemUser = await db.query.user.findFirst({
    where: eq(user.email, "system@medwaster.com"),
  });

  if (!systemUser) {
    console.log("  → Creating system user...");
    const [newSystemUser] = await db.insert(user).values({
      id: "system",
      email: "system@medwaster.com",
      name: "Sistema",
      emailVerified: true,
      role: "super-admin",
    }).returning();
    systemUser = newSystemUser;
  }

  const systemUserId = systemUser.id;

  // Check if achievements already exist
  const existingAchievements = await db.query.achievements.findMany();

  if (existingAchievements.length === 0) {
    console.log("  → Creating base achievements...");

    await db.insert(achievements).values([
      // GENERAL CATEGORY
      {
        slug: "first-login",
        name: "Primeiro Passo",
        description: "Faça seu primeiro login no sistema",
        category: "general",
        difficulty: "bronze",
        type: "milestone",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "log-in",
          color: "#10B981",
        },
        triggerConfig: {
          type: "first_login",
          conditions: {},
        },
        rewards: {
          points: 10,
        },
        displayOrder: 1,
        createdBy: systemUserId,
      },
      {
        slug: "login-streak-7",
        name: "Sete Dias de Dedicação",
        description: "Faça login por 7 dias consecutivos",
        category: "engagement",
        difficulty: "silver",
        type: "streak",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "flame",
          color: "#F59E0B",
        },
        triggerConfig: {
          type: "login_streak",
          conditions: {
            streakDays: 7,
          },
        },
        rewards: {
          points: 100,
        },
        displayOrder: 10,
        createdBy: systemUserId,
      },
      {
        slug: "login-streak-30",
        name: "Mês de Compromisso",
        description: "Faça login por 30 dias consecutivos",
        category: "engagement",
        difficulty: "gold",
        type: "streak",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "trophy",
          color: "#FFD700",
        },
        triggerConfig: {
          type: "login_streak",
          conditions: {
            streakDays: 30,
          },
        },
        rewards: {
          points: 500,
        },
        displayOrder: 11,
        createdBy: systemUserId,
      },

      // TRAILS CATEGORY
      {
        slug: "first-trail",
        name: "Explorador Iniciante",
        description: "Complete sua primeira trilha",
        category: "trails",
        difficulty: "bronze",
        type: "milestone",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "map",
          color: "#3B82F6",
        },
        triggerConfig: {
          type: "complete_trails",
          conditions: {
            count: 1,
          },
        },
        rewards: {
          points: 50,
        },
        displayOrder: 20,
        createdBy: systemUserId,
      },
      {
        slug: "trail-master-5",
        name: "Trilheiro",
        description: "Complete 5 trilhas diferentes",
        category: "trails",
        difficulty: "silver",
        type: "progressive",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "compass",
          color: "#3B82F6",
        },
        triggerConfig: {
          type: "complete_trails",
          conditions: {
            count: 5,
          },
        },
        rewards: {
          points: 250,
        },
        displayOrder: 21,
        createdBy: systemUserId,
      },
      {
        slug: "trail-master-10",
        name: "Mestre das Trilhas",
        description: "Complete 10 trilhas diferentes",
        category: "trails",
        difficulty: "gold",
        type: "progressive",
        status: "inactive",
        visibility: "public",
        badge: {
          type: "icon",
          value: "award",
          color: "#3B82F6",
        },
        triggerConfig: {
          type: "complete_trails",
          conditions: {
            count: 10,
          },
        },
        rewards: {
          points: 500,
        },
        displayOrder: 22,
        createdBy: systemUserId,
      },
      {
        slug: "perfect-trail",
        name: "Perfeição",
        description: "Complete uma trilha com pontuação perfeita",
        category: "trails",
        difficulty: "silver",
        type: "milestone",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "star",
          color: "#FFD700",
        },
        triggerConfig: {
          type: "complete_trails_perfect",
          conditions: {
            count: 1,
            perfectScore: true,
          },
        },
        rewards: {
          points: 150,
        },
        displayOrder: 23,
        createdBy: systemUserId,
      },

      // WIKI CATEGORY
      {
        slug: "first-article",
        name: "Leitor Curioso",
        description: "Leia seu primeiro artigo",
        category: "wiki",
        difficulty: "bronze",
        type: "milestone",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "book-open",
          color: "#10B981",
        },
        triggerConfig: {
          type: "read_articles_count",
          conditions: {
            count: 1,
          },
        },
        rewards: {
          points: 25,
        },
        displayOrder: 30,
        createdBy: systemUserId,
      },
      {
        slug: "article-reader-10",
        name: "Devorador de Conhecimento",
        description: "Leia 10 artigos",
        category: "wiki",
        difficulty: "silver",
        type: "progressive",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "book",
          color: "#10B981",
        },
        triggerConfig: {
          type: "read_articles_count",
          conditions: {
            count: 10,
          },
        },
        rewards: {
          points: 200,
        },
        displayOrder: 31,
        createdBy: systemUserId,
      },
      {
        slug: "article-reader-50",
        name: "Biblioteca Pessoal",
        description: "Leia 50 artigos",
        category: "wiki",
        difficulty: "gold",
        type: "progressive",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "library",
          color: "#10B981",
        },
        triggerConfig: {
          type: "read_articles_count",
          conditions: {
            count: 50,
          },
        },
        rewards: {
          points: 750,
        },
        displayOrder: 32,
        createdBy: systemUserId,
      },

      // QUESTIONS CATEGORY
      {
        slug: "first-question",
        name: "Primeira Resposta",
        description: "Responda sua primeira questão",
        category: "questions",
        difficulty: "bronze",
        type: "milestone",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "help-circle",
          color: "#F59E0B",
        },
        triggerConfig: {
          type: "questions_answered_count",
          conditions: {
            count: 1,
          },
        },
        rewards: {
          points: 25,
        },
        displayOrder: 40,
        createdBy: systemUserId,
      },
      {
        slug: "question-master-50",
        name: "Respondedor Ávido",
        description: "Responda 50 questões",
        category: "questions",
        difficulty: "silver",
        type: "progressive",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "message-circle",
          color: "#F59E0B",
        },
        triggerConfig: {
          type: "questions_answered_count",
          conditions: {
            count: 50,
          },
        },
        rewards: {
          points: 300,
        },
        displayOrder: 41,
        createdBy: systemUserId,
      },
      {
        slug: "accuracy-master",
        name: "Precisão Cirúrgica",
        description: "Atinja 90% de precisão em 20 questões",
        category: "questions",
        difficulty: "gold",
        type: "milestone",
        status: "inactive",
        visibility: "public",
        badge: {
          type: "icon",
          value: "target",
          color: "#F59E0B",
        },
        triggerConfig: {
          type: "question_accuracy_rate",
          conditions: {
            accuracyPercentage: 90,
            minimumQuestions: 20,
          },
        },
        rewards: {
          points: 400,
        },
        displayOrder: 42,
        createdBy: systemUserId,
      },

      // CERTIFICATION CATEGORY
      {
        slug: "first-certificate",
        name: "Certificado",
        description: "Obtenha seu primeiro certificado",
        category: "certification",
        difficulty: "silver",
        type: "milestone",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "award",
          color: "#8B5CF6",
        },
        triggerConfig: {
          type: "first_certificate",
          conditions: {},
        },
        rewards: {
          points: 300,
        },
        displayOrder: 50,
        createdBy: systemUserId,
      },
      {
        slug: "certificate-excellence",
        name: "Excelência Certificada",
        description: "Obtenha um certificado com mais de 90% de aproveitamento",
        category: "certification",
        difficulty: "gold",
        type: "milestone",
        status: "active",
        visibility: "public",
        badge: {
          type: "icon",
          value: "medal",
          color: "#8B5CF6",
        },
        triggerConfig: {
          type: "certificate_high_score",
          conditions: {
            scorePercentage: 90,
          },
        },
        rewards: {
          points: 500,
        },
        displayOrder: 51,
        createdBy: systemUserId,
      },
    ]);

    console.log("  ✓ Created base achievements");
  } else {
    console.log("  ⊘ Achievements already exist, skipping...");
  }

  console.log("  ✓ Achievements seeding completed");
}
