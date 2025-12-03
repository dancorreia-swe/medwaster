/**
 * Centralized API Error Handling Utilities
 *
 * This module provides standardized error handling for all API requests
 * across the application, ensuring consistent error messages and validation
 * feedback to users.
 */

// ===================================
// Error Messages
// ===================================

const ERROR_MESSAGES: Record<string, string> = {
  // Business Logic Errors
  NEED_CATEGORY:
    "É necessário selecionar uma categoria para publicar o artigo.",
  BUSINESS_LOGIC_ERROR: "Erro de regra de negócio.",
  DEPENDENCY_ERROR:
    "Este recurso não pode ser modificado pois está em uso por outros recursos.",

  // Validation Errors
  VALIDATION_ERROR: "Erro de validação. Verifique os dados e tente novamente.",
  UNPROCESSABLE_ENTITY: "Os dados fornecidos são inválidos.",
  BAD_REQUEST: "Requisição inválida. Verifique os dados enviados.",

  // Auth Errors
  UNAUTHORIZED: "Você não tem permissão para realizar esta ação.",
  FORBIDDEN: "Acesso negado.",

  // Resource Errors
  NOT_FOUND: "Recurso não encontrado.",
  CONFLICT: "Este recurso já existe ou há um conflito.",

  // Server Errors
  INTERNAL_SERVER_ERROR: "Erro interno do servidor. Tente novamente mais tarde.",
  SERVICE_UNAVAILABLE: "Serviço temporariamente indisponível.",
  DATABASE_ERROR: "Erro ao acessar o banco de dados.",

  // Rate Limiting
  TOO_MANY_REQUESTS: "Muitas requisições. Aguarde alguns instantes.",
};

// ===================================
// Field Name Translations
// ===================================

const FIELD_TRANSLATIONS: Record<string, string> = {
  // Common fields
  title: "título",
  name: "nome",
  description: "descrição",
  content: "conteúdo",
  excerpt: "resumo",
  categoryId: "categoria",
  tagIds: "tags",
  status: "status",

  // Wiki/Article fields
  featuredImageUrl: "imagem de destaque",
  externalUrl: "URL externa",
  externalAuthors: "autores",
  publicationDate: "data de publicação",
  publicationSource: "fonte de publicação",
  readingTimeMinutes: "tempo de leitura",
  icon: "ícone",
  sourceType: "tipo de fonte",

  // Trail fields
  difficulty: "dificuldade",
  unlockOrder: "ordem de desbloqueio",
  passPercentage: "percentual de aprovação",
  attemptsAllowed: "tentativas permitidas",
  timeLimitMinutes: "tempo limite",
  allowSkipQuestions: "permitir pular questões",
  showImmediateExplanations: "mostrar explicações imediatas",
  randomizeContentOrder: "randomizar ordem do conteúdo",
  coverImageUrl: "imagem de capa",
  coverImageKey: "chave da imagem de capa",
  themeColor: "cor do tema",
  estimatedTimeMinutes: "tempo estimado",
  customCertificate: "certificado personalizado",

  // Trail content fields
  contentType: "tipo de conteúdo",
  contentId: "ID do conteúdo",
  sequence: "sequência",
  isRequired: "obrigatório",

  // Question fields
  prompt: "enunciado",
  explanation: "explicação",
  points: "pontos",
  timeLimit: "tempo limite",
  imageUrl: "imagem",

  // Quiz fields
  passingScore: "nota mínima",
  showResults: "mostrar resultados",
  shuffleQuestions: "embaralhar questões",
};

// ===================================
// Utility Functions
// ===================================

/**
 * Checks if an API response contains an error
 */
export const isErrorResponse = (response: any): boolean => {
  return response?.error !== undefined && response?.error !== null;
};

/**
 * Translates validation field names to Portuguese
 */
export const translateFieldName = (field: string): string => {
  return FIELD_TRANSLATIONS[field] || field;
};

/**
 * Formats validation error message in Portuguese
 */
export const formatValidationError = (details: any): string | null => {
  if (!details) return null;

  // Handle multiple validation errors
  if (details.allErrors && Array.isArray(details.allErrors)) {
    const messages = details.allErrors.map((err: any) => {
      const field = translateFieldName(err.field);
      return `• ${field}: ${err.message}`;
    });
    return `Erros de validação:\n${messages.join("\n")}`;
  }

  // Single validation error
  if (!details.field) return null;

  const field = translateFieldName(details.field);
  const constraints = details.constraints || {};

  // Handle different validation types based on constraints
  if (constraints.minLength !== undefined && constraints.maxLength !== undefined) {
    return `O campo "${field}" deve ter entre ${constraints.minLength} e ${constraints.maxLength} caracteres.`;
  }

  if (constraints.minLength !== undefined) {
    return `O campo "${field}" deve ter no mínimo ${constraints.minLength} caracteres.`;
  }

  if (constraints.maxLength !== undefined) {
    return `O campo "${field}" deve ter no máximo ${constraints.maxLength} caracteres.`;
  }

  if (constraints.minimum !== undefined && constraints.maximum !== undefined) {
    return `O campo "${field}" deve estar entre ${constraints.minimum} e ${constraints.maximum}.`;
  }

  if (constraints.minimum !== undefined) {
    return `O campo "${field}" deve ser no mínimo ${constraints.minimum}.`;
  }

  if (constraints.maximum !== undefined) {
    return `O campo "${field}" deve ser no máximo ${constraints.maximum}.`;
  }

  if (constraints.pattern) {
    return `O campo "${field}" está em formato inválido.`;
  }

  // Check the error message for specific patterns
  const message = details.message?.toLowerCase() || "";

  if (message.includes("required")) {
    return `O campo "${field}" é obrigatório.`;
  }

  if (message.includes("string") || message.includes("number") || message.includes("boolean")) {
    return `O campo "${field}" está em formato inválido.`;
  }

  // Use the backend message if available, otherwise generic message
  if (details.message) {
    return `${field}: ${details.message}`;
  }

  return `O campo "${field}" é inválido.`;
};

/**
 * Extracts error message from API response
 * Handles the standardized backend error format
 */
export const getErrorMessage = (responseError: any, defaultMessage: string): string => {
  // Handle null/undefined
  if (!responseError) return defaultMessage;

  // Handle string errors
  if (typeof responseError === "string") return responseError;

  // Extract error object from response
  // Backend format: { success: false, error: { code, message, details } }
  const errorValue = responseError?.value;
  const errorData = errorValue?.error || errorValue;

  // Get error code
  const code = errorData?.code || responseError?.code;

  // Handle validation errors with detailed field information
  if (code === "VALIDATION_ERROR" && errorData?.details) {
    const validationMessage = formatValidationError(errorData.details);
    if (validationMessage) return validationMessage;
  }

  // Handle specific error codes with custom messages
  if (code === "DEPENDENCY_ERROR") {
    const dependencies = errorData?.details?.dependencies;
    if (Array.isArray(dependencies) && dependencies.length > 0) {
      return `Não é possível realizar esta ação pois o recurso está em uso por: ${dependencies.join(", ")}.`;
    }
  }

  // Try to extract message from backend first (prioritize specific messages)
  const extractedMessage =
    errorData?.message ||
    errorValue?.message ||
    responseError?.message;

  // Use specific backend message if available
  if (extractedMessage) {
    return extractedMessage;
  }

  // Fall back to predefined error message if available
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  return defaultMessage;
};

/**
 * Handles API errors by checking response and throwing an error with a user-friendly message
 */
export const handleApiError = (response: any, defaultMessage: string): void => {
  if (isErrorResponse(response)) {
    const message = getErrorMessage(response.error, defaultMessage);
    throw new Error(message);
  }
};

/**
 * Custom hook-friendly error extractor for use in mutation error handlers
 */
export const extractErrorMessage = (error: any, defaultMessage: string): string => {
  // Handle Error objects
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  // Handle API error responses
  return getErrorMessage(error, defaultMessage);
};
