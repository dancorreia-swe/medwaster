import { db } from "../index";
import { questions, questionOptions, categories } from "../schema";
import { eq } from "drizzle-orm";

export async function questionsSeed() {
  console.log("🌱 Seeding questions...");

  try {
    const existingCategories = await db.select().from(categories).limit(5);

    let categoryIds: number[] = [];

    if (existingCategories.length === 0) {
      console.log("Creating sample categories...");
      const newCategories = await db
        .insert(categories)
        .values([
          {
            name: "Geografia",
            slug: "geografia",
            description: "Perguntas sobre geografia mundial e do Brasil",
            color: "#10B981",
          },
          {
            name: "História",
            slug: "historia",
            description: "Perguntas sobre história mundial e do Brasil",
            color: "#F59E0B",
          },
          {
            name: "Ciências",
            slug: "ciencias",
            description: "Perguntas sobre biologia, física e química",
            color: "#3B82F6",
          },
          {
            name: "Matemática",
            slug: "matematica",
            description: "Perguntas sobre matemática básica e avançada",
            color: "#8B5CF6",
          },
        ])
        .returning();

      categoryIds = newCategories.map((c) => c.id);
    } else {
      categoryIds = existingCategories.map((c) => c.id);
    }

    // Check if questions already exist
    const existingQuestions = await db.select().from(questions).limit(1);
    if (existingQuestions.length > 0) {
      console.log("Questions already exist, skipping seed...");
      return;
    }

    console.log("Inserting sample questions...");

    // Create sample questions
    const sampleQuestions = await db
      .insert(questions)
      .values([
        // Multiple Choice Questions
        {
          prompt: "Qual é a capital do Brasil?",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[0], // Geografia
          explanation: "Brasília é a capital federal do Brasil desde 1960.",
          createdBy: "admin",
          updatedBy: "admin",
        },
        {
          prompt: "Qual é o maior planeta do sistema solar?",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[2], // Ciências
          explanation: "Júpiter é o maior planeta do nosso sistema solar.",
          createdBy: "admin",
          updatedBy: "admin",
        },
        {
          prompt: "Em que ano foi proclamada a Independência do Brasil?",
          type: "multiple_choice",
          difficulty: "intermediate",
          status: "active",
          categoryId: categoryIds[1], // História
          explanation:
            "A Independência do Brasil foi proclamada em 7 de setembro de 1822.",
          createdBy: "admin",
          updatedBy: "admin",
        },

        // True/False Questions
        {
          prompt: "O Brasil é o maior país da América do Sul.",
          type: "true_false",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[0], // Geografia
          explanation:
            "Verdadeiro. O Brasil ocupa cerca de 47% do território sul-americano.",
          createdBy: "admin",
          updatedBy: "admin",
        },
        {
          prompt:
            "A fotossíntese é o processo pelo qual as plantas produzem seu próprio alimento.",
          type: "true_false",
          difficulty: "intermediate",
          status: "active",
          categoryId: categoryIds[2], // Ciências
          explanation:
            "Verdadeiro. As plantas convertem luz solar, água e CO2 em glicose.",
          createdBy: "admin",
          updatedBy: "admin",
        },

        // Fill in the blank
        {
          prompt: "A fórmula da água é ____.",
          type: "fill_in_the_blank",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[2], // Ciências
          explanation:
            "H2O representa dois átomos de hidrogênio e um de oxigênio.",
          createdBy: "admin",
          updatedBy: "admin",
        },

        // Math questions
        {
          prompt: "Quanto é 15 × 8?",
          type: "multiple_choice",
          difficulty: "basic",
          status: "active",
          categoryId: categoryIds[3], // Matemática
          explanation: "15 × 8 = 120",
          createdBy: "admin",
          updatedBy: "admin",
        },
        {
          prompt: "A raiz quadrada de 144 é 12.",
          type: "true_false",
          difficulty: "intermediate",
          status: "active",
          categoryId: categoryIds[3], // Matemática
          explanation: "Verdadeiro. 12 × 12 = 144",
          createdBy: "admin",
          updatedBy: "admin",
        },
      ])
      .returning();

    console.log(`Created ${sampleQuestions.length} questions`);

    // Add options for multiple choice questions
    console.log("Adding question options...");

    // Capital do Brasil options
    await db.insert(questionOptions).values([
      {
        questionId: sampleQuestions[0].id,
        label: "A",
        content: "São Paulo",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[0].id,
        label: "B",
        content: "Rio de Janeiro",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[0].id,
        label: "C",
        content: "Brasília",
        isCorrect: true,
      },
      {
        questionId: sampleQuestions[0].id,
        label: "D",
        content: "Salvador",
        isCorrect: false,
      },
    ]);

    // Maior planeta options
    await db.insert(questionOptions).values([
      {
        questionId: sampleQuestions[1].id,
        label: "A",
        content: "Terra",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[1].id,
        label: "B",
        content: "Júpiter",
        isCorrect: true,
      },
      {
        questionId: sampleQuestions[1].id,
        label: "C",
        content: "Saturno",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[1].id,
        label: "D",
        content: "Netuno",
        isCorrect: false,
      },
    ]);

    // Independência do Brasil options
    await db.insert(questionOptions).values([
      {
        questionId: sampleQuestions[2].id,
        label: "A",
        content: "1822",
        isCorrect: true,
      },
      {
        questionId: sampleQuestions[2].id,
        label: "B",
        content: "1825",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[2].id,
        label: "C",
        content: "1889",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[2].id,
        label: "D",
        content: "1500",
        isCorrect: false,
      },
    ]);

    // Math question options
    await db.insert(questionOptions).values([
      {
        questionId: sampleQuestions[6].id,
        label: "A",
        content: "110",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[6].id,
        label: "B",
        content: "120",
        isCorrect: true,
      },
      {
        questionId: sampleQuestions[6].id,
        label: "C",
        content: "130",
        isCorrect: false,
      },
      {
        questionId: sampleQuestions[6].id,
        label: "D",
        content: "140",
        isCorrect: false,
      },
    ]);

    console.log("✅ Questions seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding questions:", error);
    throw error;
  }
}

