import { db } from "../index";
import {
  trails,
  trailContent,
  trailPrerequisites,
  userTrailProgress,
} from "../schema/trails";
import { questions, questionOptions } from "../schema/questions";
import { quizzes, quizQuestions } from "../schema/quizzes";
import { wikiArticles } from "../schema/wiki";
import { contentCategories } from "../schema/categories";
import { user } from "../schema/auth";
import { eq } from "drizzle-orm";

export async function trailsSeed() {
  console.log("🛤️  Seeding trails...");

  try {
    // Check if trails already exist
    const existingTrails = await db.select().from(trails).limit(1);
    if (existingTrails.length > 0) {
      console.log("Trails already exist, skipping seed...");
      return;
    }

    // Get or create admin user
    const adminEmail = process.env.ADMIN_EMAIL || "daniel@admin.com";
    let adminUser = await db.query.user.findFirst({
      where: eq(user.email, adminEmail),
    });

    if (!adminUser) {
      console.log("Admin user not found, please run user seed first");
      return;
    }

    const adminId = adminUser.id;

    // Get or create categories
    let categoryIds: number[] = [];
    const existingCategories = await db.select().from(contentCategories).limit(5);

    if (existingCategories.length === 0) {
      console.log("Creating sample categories...");

      const newCategories = await db
        .insert(contentCategories)
        .values([
          {
            name: "Fundamentos Médicos",
            slug: "fundamentos-medicos",
            description: "Conceitos básicos da medicina",
            color: "#10B981",
            isActive: true,
          },
          {
            name: "Anatomia",
            slug: "anatomia",
            description: "Estudo do corpo humano",
            color: "#F59E0B",
            isActive: true,
          },
          {
            name: "Farmacologia",
            slug: "farmacologia",
            description: "Estudo de medicamentos e seus efeitos",
            color: "#3B82F6",
            isActive: true,
          },
        ])
        .returning();

      categoryIds = newCategories.map((c) => c.id);
    } else {
      categoryIds = existingCategories.map((c) => c.id);
    }

    // Create sample questions
    console.log("Creating sample questions for trails...");
    const sampleQuestions = await db
      .insert(questions)
      .values([
        {
          prompt: "Qual é a maior artéria do corpo humano?",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[1] || null,
          explanation: "A aorta é a maior artéria do corpo humano.",
          authorId: adminId,
        },
        {
          prompt: "O coração humano tem quantas câmaras?",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[1] || null,
          explanation: "O coração humano possui 4 câmaras: 2 átrios e 2 ventrículos.",
          authorId: adminId,
        },
        {
          prompt: "A hemoglobina transporta oxigênio no sangue.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[0] || null,
          explanation: "Verdadeiro. A hemoglobina é a proteína responsável pelo transporte de oxigênio.",
          authorId: adminId,
        },
        {
          prompt: "Qual sistema do corpo é responsável pela defesa contra infecções?",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          categoryId: categoryIds[0] || null,
          explanation: "O sistema imunológico é responsável pela defesa do organismo.",
          authorId: adminId,
        },
        {
          prompt: "Qual é a função principal dos rins?",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          categoryId: categoryIds[0] || null,
          explanation: "Os rins filtram o sangue e eliminam resíduos através da urina.",
          authorId: adminId,
        },
      ])
      .returning();

    // Create options for multiple choice questions
    console.log("Creating question options...");
    for (const question of sampleQuestions) {
      if (question.type === "multiple_choice") {
        let options: Array<{ label: string; content: string; isCorrect: boolean }> = [];

        switch (question.prompt) {
          case "Qual é a maior artéria do corpo humano?":
            options = [
              { label: "A", content: "Aorta", isCorrect: true },
              { label: "B", content: "Veia Cava", isCorrect: false },
              { label: "C", content: "Artéria Pulmonar", isCorrect: false },
              { label: "D", content: "Carótida", isCorrect: false },
            ];
            break;
          case "O coração humano tem quantas câmaras?":
            options = [
              { label: "A", content: "2", isCorrect: false },
              { label: "B", content: "3", isCorrect: false },
              { label: "C", content: "4", isCorrect: true },
              { label: "D", content: "5", isCorrect: false },
            ];
            break;
          case "Qual sistema do corpo é responsável pela defesa contra infecções?":
            options = [
              { label: "A", content: "Sistema Digestivo", isCorrect: false },
              { label: "B", content: "Sistema Imunológico", isCorrect: true },
              { label: "C", content: "Sistema Nervoso", isCorrect: false },
              { label: "D", content: "Sistema Respiratório", isCorrect: false },
            ];
            break;
          case "Qual é a função principal dos rins?":
            options = [
              { label: "A", content: "Bombear sangue", isCorrect: false },
              { label: "B", content: "Filtrar o sangue", isCorrect: true },
              { label: "C", content: "Produzir hormônios", isCorrect: false },
              { label: "D", content: "Armazenar nutrientes", isCorrect: false },
            ];
            break;
        }

        await db.insert(questionOptions).values(
          options.map((opt) => ({
            questionId: question.id,
            ...opt,
          })),
        );
      } else if (question.type === "true_false") {
        await db.insert(questionOptions).values([
          {
            questionId: question.id,
            label: "A",
            content: "Verdadeiro",
            isCorrect: true,
          },
          {
            questionId: question.id,
            label: "B",
            content: "Falso",
            isCorrect: false,
          },
        ]);
      }
    }

    // Create sample quizzes
    console.log("Creating sample quizzes...");
    const sampleQuizzes = await db
      .insert(quizzes)
      .values([
        {
          title: "Introdução à Anatomia Humana",
          description: "Teste seus conhecimentos sobre os sistemas do corpo humano",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[1] || null,
          authorId: adminId,
          timeLimit: 10,
          maxAttempts: 3,
          showResults: true,
          showCorrectAnswers: true,
          randomizeQuestions: false,
          randomizeOptions: false,
          passingScore: 70,
        },
        {
          title: "Fundamentos da Farmacologia",
          description: "Conceitos básicos sobre medicamentos e sua ação",
          difficulty: "intermediate",
          status: "active",
          categoryId: categoryIds[2] || null,
          authorId: adminId,
          timeLimit: 15,
          maxAttempts: 2,
          showResults: true,
          showCorrectAnswers: true,
          randomizeQuestions: false,
          randomizeOptions: false,
          passingScore: 75,
        },
      ])
      .returning();

    // Add questions to quizzes
    console.log("Adding questions to quizzes...");
    await db.insert(quizQuestions).values([
      {
        quizId: sampleQuizzes[0].id,
        questionId: sampleQuestions[0].id,
        order: 1,
        points: 10,
        required: true,
      },
      {
        quizId: sampleQuizzes[0].id,
        questionId: sampleQuestions[1].id,
        order: 2,
        points: 10,
        required: true,
      },
    ]);

    // Create sample wiki articles
    console.log("Creating sample wiki articles...");
    const sampleArticles = await db
      .insert(wikiArticles)
      .values([
        {
          title: "Introdução ao Sistema Cardiovascular",
          slug: "introducao-sistema-cardiovascular",
          content: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Sistema Cardiovascular" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "O sistema cardiovascular é composto pelo coração e vasos sanguíneos.",
                  },
                ],
              },
            ],
          }),
          contentText: "Sistema Cardiovascular. O sistema cardiovascular é composto pelo coração e vasos sanguíneos.",
          excerpt: "Aprenda sobre o sistema que mantém o sangue circulando pelo corpo",
          readingTimeMinutes: 5,
          status: "published",
          authorId: adminId,
          categoryId: categoryIds[1] || null,
          publishedAt: new Date(),
        },
        {
          title: "Fundamentos da Fisiologia Humana",
          slug: "fundamentos-fisiologia-humana",
          content: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Fisiologia Humana" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "A fisiologia estuda as funções dos sistemas do corpo humano.",
                  },
                ],
              },
            ],
          }),
          contentText: "Fisiologia Humana. A fisiologia estuda as funções dos sistemas do corpo humano.",
          excerpt: "Entenda como o corpo humano funciona",
          readingTimeMinutes: 8,
          status: "published",
          authorId: adminId,
          categoryId: categoryIds[0] || null,
          publishedAt: new Date(),
        },
        {
          title: "Princípios de Farmacologia",
          slug: "principios-farmacologia",
          content: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Farmacologia Básica" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "A farmacologia estuda como os medicamentos interagem com o organismo.",
                  },
                ],
              },
            ],
          }),
          contentText: "Farmacologia Básica. A farmacologia estuda como os medicamentos interagem com o organismo.",
          excerpt: "Conceitos essenciais sobre medicamentos",
          readingTimeMinutes: 10,
          status: "published",
          authorId: adminId,
          categoryId: categoryIds[2] || null,
          publishedAt: new Date(),
        },
      ])
      .returning();

    // Create trails
    console.log("Creating trails...");
    const createdTrails = await db
      .insert(trails)
      .values([
        {
          trailId: "fundamentos-medicina",
          name: "Fundamentos da Medicina",
          description: "Trilha introdutória para estudantes de medicina. Aprenda os conceitos básicos antes de avançar.",
          categoryId: categoryIds[0] || null,
          difficulty: "basic",
          status: "published",
          unlockOrder: 1,
          passPercentage: 70,
          attemptsAllowed: 3,
          timeLimitMinutes: null,
          allowSkipQuestions: false, // Sequential
          showImmediateExplanations: true,
          randomizeContentOrder: false,
          coverImageUrl: null,
          themeColor: "#10B981",
          estimatedTimeMinutes: 30,
          customCertificate: false,
          authorId: adminId,
          enrolledCount: 0,
          completionRate: 0,
          averageCompletionMinutes: null,
        },
        {
          trailId: "anatomia-essencial",
          name: "Anatomia Essencial",
          description: "Estudo detalhado dos sistemas do corpo humano. Requer conclusão da trilha de fundamentos.",
          categoryId: categoryIds[1] || null,
          difficulty: "intermediate",
          status: "published",
          unlockOrder: 2,
          passPercentage: 75,
          attemptsAllowed: 3,
          timeLimitMinutes: 60,
          allowSkipQuestions: true, // Free navigation
          showImmediateExplanations: true,
          randomizeContentOrder: false,
          coverImageUrl: null,
          themeColor: "#F59E0B",
          estimatedTimeMinutes: 60,
          customCertificate: true,
          authorId: adminId,
          enrolledCount: 0,
          completionRate: 0,
          averageCompletionMinutes: null,
        },
        {
          trailId: "farmacologia-clinica",
          name: "Farmacologia Clínica",
          description: "Aprenda sobre medicamentos e suas aplicações clínicas. Trilha avançada.",
          categoryId: categoryIds[2] || null,
          difficulty: "advanced",
          status: "published",
          unlockOrder: 3,
          passPercentage: 80,
          attemptsAllowed: 2,
          timeLimitMinutes: 90,
          allowSkipQuestions: false,
          showImmediateExplanations: false,
          randomizeContentOrder: false,
          coverImageUrl: null,
          themeColor: "#3B82F6",
          estimatedTimeMinutes: 90,
          customCertificate: true,
          authorId: adminId,
          enrolledCount: 0,
          completionRate: 0,
          averageCompletionMinutes: null,
        },
        {
          trailId: "introducao-rapida",
          name: "Introdução Rápida",
          description: "Trilha de boas-vindas - sem pré-requisitos. Livre para todos!",
          categoryId: categoryIds[0] || null,
          difficulty: "basic",
          status: "published",
          unlockOrder: 0,
          passPercentage: 60,
          attemptsAllowed: 5,
          timeLimitMinutes: null,
          allowSkipQuestions: true,
          showImmediateExplanations: true,
          randomizeContentOrder: false,
          coverImageUrl: null,
          themeColor: "#8B5CF6",
          estimatedTimeMinutes: 15,
          customCertificate: false,
          authorId: adminId,
          enrolledCount: 0,
          completionRate: 0,
          averageCompletionMinutes: null,
        },
      ])
      .returning();

    const [fundamentosTrail, anatomiaTrail, farmacologiaTrail, introducaoTrail] = createdTrails;

    // Set up prerequisites
    console.log("Setting up trail prerequisites...");
    await db.insert(trailPrerequisites).values([
      {
        trailId: anatomiaTrail.id,
        prerequisiteTrailId: fundamentosTrail.id,
      },
      {
        trailId: farmacologiaTrail.id,
        prerequisiteTrailId: anatomiaTrail.id,
      },
    ]);

    // Add content to "Introdução Rápida" trail
    console.log("Adding content to Introdução Rápida trail...");
    await db.insert(trailContent).values([
      {
        trailId: introducaoTrail.id,
        articleId: sampleArticles[1].id, // Fundamentos da Fisiologia
        sequence: 0,
        isRequired: true,
      },
      {
        trailId: introducaoTrail.id,
        questionId: sampleQuestions[2].id, // True/False question
        sequence: 1,
        isRequired: true,
      },
    ]);

    // Add content to "Fundamentos da Medicina" trail
    console.log("Adding content to Fundamentos da Medicina trail...");
    await db.insert(trailContent).values([
      {
        trailId: fundamentosTrail.id,
        articleId: sampleArticles[1].id, // Fundamentos da Fisiologia
        sequence: 0,
        isRequired: true,
      },
      {
        trailId: fundamentosTrail.id,
        questionId: sampleQuestions[2].id, // True/False
        sequence: 1,
        isRequired: true,
      },
      {
        trailId: fundamentosTrail.id,
        questionId: sampleQuestions[3].id, // Sistema imunológico
        sequence: 2,
        isRequired: true,
      },
      {
        trailId: fundamentosTrail.id,
        questionId: sampleQuestions[4].id, // Rins
        sequence: 3,
        isRequired: false, // Optional
      },
    ]);

    // Add content to "Anatomia Essencial" trail
    console.log("Adding content to Anatomia Essencial trail...");
    await db.insert(trailContent).values([
      {
        trailId: anatomiaTrail.id,
        articleId: sampleArticles[0].id, // Sistema Cardiovascular
        sequence: 0,
        isRequired: true,
      },
      {
        trailId: anatomiaTrail.id,
        questionId: sampleQuestions[0].id, // Artéria
        sequence: 1,
        isRequired: true,
      },
      {
        trailId: anatomiaTrail.id,
        questionId: sampleQuestions[1].id, // Coração
        sequence: 2,
        isRequired: true,
      },
      {
        trailId: anatomiaTrail.id,
        quizId: sampleQuizzes[0].id, // Quiz de Anatomia
        sequence: 3,
        isRequired: true,
      },
    ]);

    // Add content to "Farmacologia Clínica" trail
    console.log("Adding content to Farmacologia Clínica trail...");
    await db.insert(trailContent).values([
      {
        trailId: farmacologiaTrail.id,
        articleId: sampleArticles[2].id, // Princípios de Farmacologia
        sequence: 0,
        isRequired: true,
      },
      {
        trailId: farmacologiaTrail.id,
        quizId: sampleQuizzes[1].id, // Quiz de Farmacologia
        sequence: 1,
        isRequired: true,
      },
    ]);

    console.log("✅ Trails seed completed!");
    console.log(`   - Created ${createdTrails.length} trails`);
    console.log(`   - Created ${sampleQuestions.length} questions`);
    console.log(`   - Created ${sampleQuizzes.length} quizzes`);
    console.log(`   - Created ${sampleArticles.length} articles`);
    console.log("\n📊 Trail Structure:");
    console.log("   1. Introdução Rápida (no prerequisites)");
    console.log("   2. Fundamentos da Medicina (no prerequisites)");
    console.log("   3. Anatomia Essencial (requires: Fundamentos)");
    console.log("   4. Farmacologia Clínica (requires: Anatomia)");
  } catch (error) {
    console.error("Error seeding trails:", error);
    throw error;
  }
}
