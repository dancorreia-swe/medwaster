import { client } from "@/lib/eden";
import type { SuccessResponse } from "@server/lib/responses";

// Helper function to assert API success
function assertSuccess<T>(
  response: { data?: SuccessResponse<T>; error?: unknown } | undefined,
  fallbackMessage: string,
): T {
  if (!response) {
    throw new Error(fallbackMessage);
  }

  if ("error" in response && response.error) {
    const error = response.error as any;

    // Try to extract meaningful error message
    let message = fallbackMessage;

    if (typeof error === "string") {
      message = error;
    } else if (error?.value) {
      // Eden error format
      if (typeof error.value === "string") {
        message = error.value;
      } else if (error.value?.message) {
        message = error.value.message;
      } else if (error.value?.error) {
        message = error.value.error;
      }
    } else if (error?.message) {
      message = error.message;
    } else if (error?.error) {
      message = error.error;
    }

    console.error("API Error:", error);
    throw new Error(message);
  }

  if (!response.data || response.data.success !== true) {
    throw new Error(fallbackMessage);
  }

  return response.data.data;
}

// ============================================================================
// Trail Endpoints
// ============================================================================

/**
 * Fetch list of trails with optional filters
 */
export async function fetchTrails(params?: {
  difficulty?: string;
  categoryId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const response = await client.trails.index.get({
    query: params as any,
  });

  return assertSuccess(response, "Não foi possível carregar as trilhas.");
}

/**
 * Fetch recommended trails based on user activity
 */
export async function fetchRecommendedTrails() {
  const response = await client.trails.recommended.get();

  return assertSuccess(
    response,
    "Não foi possível carregar as trilhas recomendadas.",
  );
}

/**
 * Fetch recommended categories based on user activity
 */
export async function fetchRecommendedCategories() {
  const response = await client.trails.categories.recommended.get();

  return assertSuccess(
    response,
    "Não foi possível carregar as categorias recomendadas.",
  );
}

/**
 * Fetch single trail by ID with full details
 */
export async function fetchTrailById(id: number) {
  const response = await client.trails({ id }).get();

  return assertSuccess(response, "Não foi possível carregar a trilha.");
}

/**
 * Fetch user's progress in a specific trail
 */
export async function fetchTrailProgress(id: number) {
  const response = await client.trails({ id }).progress.get();

  return assertSuccess(response, "Não foi possível carregar o progresso.");
}

/**
 * Enroll user in a trail
 */
export async function enrollInTrail(id: number) {
  console.log("📝 Enrolling in trail:", id);

  try {
    const response = await client.trails({ id }).enroll.post();
    console.log("✅ Enroll response:", response);

    return assertSuccess(response, "Não foi possível se inscrever na trilha.");
  } catch (error) {
    console.error("❌ Enroll error:", error);
    throw error;
  }
}

/**
 * Fetch trail content list for enrolled trail
 */
export async function fetchTrailContent(id: number) {
  const response = await client.trails({ id }).content.get();

  return assertSuccess(response, "Não foi possível carregar o conteúdo.");
}

// ============================================================================
// Question in Trail Endpoints
// ============================================================================

/**
 * Submit answer for a question within a trail
 */
export async function submitTrailQuestion(
  trailId: number,
  questionId: number,
  data: {
    answer: number | number[] | string | Record<string, string>;
    timeSpentSeconds?: number;
  },
) {
  const response = await client
    .trails({ id: trailId })
    .questions({ questionId })
    .submit.post(data);

  return assertSuccess(
    response,
    "Não foi possível enviar a resposta da questão.",
  );
}

// ============================================================================
// Quiz in Trail Endpoints
// ============================================================================

/**
 * Start a quiz attempt within a trail
 */
export async function startTrailQuiz(
  trailId: number,
  contentId: number,
  data: { ipAddress?: string; userAgent?: string },
) {
  const response = await client
    .trails({ id: trailId })
    .content({ contentId })
    .quiz.start.post(data);

  return assertSuccess(response, "Não foi possível iniciar o quiz.");
}

/**
 * Submit quiz attempt within a trail
 */
export async function submitTrailQuiz(
  trailId: number,
  contentId: number,
  attemptId: number,
  data: {
    answers: Array<{
      quizQuestionId: number;
      selectedOptions?: number[];
      textAnswer?: string;
      matchingAnswers?: Record<string, string>;
      timeSpent?: number;
    }>;
    timeSpent?: number;
  },
) {
  const response = await client
    .trails({ id: trailId })
    .content({ contentId })
    .quiz.submit({ attemptId })
    .post(data);

  return assertSuccess(response, "Não foi possível enviar o quiz.");
}

// ============================================================================
// Article in Trail Endpoints
// ============================================================================

/**
 * Mark article as read within a trail
 */
export async function markTrailArticleRead(
  trailId: number,
  contentId: number,
) {
  const response = await client
    .trails({ id: trailId })
    .content({ contentId })
    .article["mark-read"].post();

  return assertSuccess(
    response,
    "Não foi possível marcar o artigo como lido.",
  );
}
