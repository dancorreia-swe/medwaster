import "dotenv/config";

import { createHash } from "node:crypto";
import { asc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../index";
import { user } from "../schema/auth";
import { contentCategories } from "../schema/categories";
import {
  questionFillBlankAnswers,
  questionFillBlankOptions,
  questionMatchingPairs,
  questionOptions,
  questionTags,
  questions,
  tags,
} from "../schema/questions";
import { quizQuestions, quizTags, quizzes } from "../schema/quizzes";
import { trailContent, trails } from "../schema/trails";
import { wikiArticleTags, wikiArticles } from "../schema/wiki";

type RawRecord = Record<string, unknown>;
type DbTransaction = any;

type BatchMetadata = {
  batchKey: string;
  category: {
    name: string;
    slug: string;
  };
  tag: {
    name: string;
    slug: string;
  };
};

export type NormalizedArticle = {
  sourceKey: string;
  title: string;
  slug: string;
  icon: string | null;
  content: unknown[];
  contentText: string;
  excerpt: string | null;
  readingTimeMinutes: number | null;
};

export type NormalizedOption = {
  label: string;
  content: string;
  isCorrect: boolean;
};

export type NormalizedBlank = {
  sequence: number;
  placeholder: string | null;
  answer: string;
  options: Array<{ text: string; isCorrect: boolean }>;
};

export type NormalizedPair = {
  leftText: string;
  rightText: string;
  sequence: number;
};

export type NormalizedQuestion = {
  sourceKey: string;
  prompt: string;
  explanation: string | null;
  type: "multiple_choice" | "true_false" | "fill_in_the_blank" | "matching";
  difficulty: "basic" | "intermediate" | "advanced";
  options: NormalizedOption[];
  fillInBlanks: NormalizedBlank[];
  matchingPairs: NormalizedPair[];
  references: unknown[] | null;
};

export type NormalizedQuizQuestion = {
  questionSourceKey: string;
  order: number;
  points: number;
  required: boolean;
};

export type NormalizedQuiz = {
  sourceKey: string;
  title: string;
  description: string | null;
  instructions: string | null;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  timeLimit: number | null;
  maxAttempts: number | null;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  passingScore: number | null;
  imageUrl: string | null;
  questions: NormalizedQuizQuestion[];
};

export type NormalizedTrailContent = {
  type: "article" | "question" | "quiz";
  sourceKey: string;
  sequence: number;
  isRequired: boolean;
};

export type NormalizedTrail = {
  sourceKey: string;
  trailId: string;
  name: string;
  description: string | null;
  difficulty: "basic" | "intermediate" | "advanced";
  unlockOrder: number | null;
  passPercentage: number;
  attemptsAllowed: number | null;
  timeLimitMinutes: number | null;
  allowSkipQuestions: boolean;
  showImmediateExplanations: boolean;
  randomizeContentOrder: boolean;
  themeColor: string | null;
  estimatedTimeMinutes: number | null;
  customCertificate: boolean;
  content: NormalizedTrailContent[];
};

export type NormalizedManifest = {
  batchKey: string;
  articles: NormalizedArticle[];
  questions: NormalizedQuestion[];
  quizzes: NormalizedQuiz[];
  trails: NormalizedTrail[];
  category: BatchMetadata["category"];
  tag: BatchMetadata["tag"];
};

type ImportIds = {
  articles: Record<string, number>;
  questions: Record<string, number>;
  quizzes: Record<string, number>;
  trails: Record<string, number>;
};

type ImportStatuses = {
  articles: Record<string, string | null>;
  questions: Record<string, string | null>;
  quizzes: Record<string, string | null>;
  trails: Record<string, string | null>;
};

type ImportCounts = {
  articles: number;
  quizzes: number;
  questions: number;
  trails: number;
};

type ImportReport = {
  batch: string;
  manifestSha256: string;
  status: "dry-run" | "applied" | "published" | "quarantined";
  publicationRequested: boolean;
  quarantineRequested: boolean;
  categoryId: number | null;
  tagId: number | null;
  warnings: string[];
  counts: ImportCounts;
  created: ImportCounts;
  reused: ImportCounts;
  ids: {
    articles: Array<{ sourceKey: string; id: number | null; status: string | null }>;
    questions: Array<{ sourceKey: string; id: number | null; status: string | null }>;
    quizzes: Array<{ sourceKey: string; id: number | null; status: string | null }>;
    trails: Array<{ sourceKey: string; id: number | null; status: string | null }>;
  };
  states: {
    articles: Record<string, number>;
    questions: Record<string, number>;
    quizzes: Record<string, number>;
    trails: Record<string, number>;
  };
  embeddingEnqueue: {
    requested: boolean;
    status: "not-requested" | "enqueued" | "not-enqueued";
    count: number;
    warning?: string;
  };
};

type ImportPhaseResult = {
  report: Omit<ImportReport, "status" | "publicationRequested" | "quarantineRequested" | "states" | "embeddingEnqueue">;
  ids: ImportIds;
  statuses: ImportStatuses;
};

function record(value: unknown, path: string): RawRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as RawRecord;
}

function optionalRecord(value: unknown): RawRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as RawRecord)
    : undefined;
}

function array(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value;
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(value: unknown, path: string): string | null {
  if (value === undefined || value === null) return null;
  return nonEmptyString(value, path);
}

function integer(value: unknown, path: string, minimum = 0): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
    throw new Error(`${path} must be an integer >= ${minimum}`);
  }
  return value;
}

function optionalInteger(
  value: unknown,
  path: string,
  minimum = 0,
): number | null {
  if (value === undefined || value === null) return null;
  return integer(value, path, minimum);
}

function numberInRange(value: unknown, path: string, minimum: number, maximum: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new Error(`${path} must be a number between ${minimum} and ${maximum}`);
  }
  return value;
}

function optionalBoolean(value: unknown, path: string, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "boolean") throw new Error(`${path} must be a boolean`);
  return value;
}

function calculateReadingTime(contentText: string): number {
  const words = contentText.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function first(value: RawRecord, ...keys: string[]): unknown {
  for (const key of keys) if (value[key] !== undefined) return value[key];
  return undefined;
}

function sourceKey(value: RawRecord, path: string): string {
  return nonEmptyString(first(value, "sourceKey", "source_key", "sourceId", "source_id", "key", "id"), `${path}.sourceKey`);
}

function assertUnique(values: string[], path: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${path} contains duplicate value ${value}`);
    seen.add(value);
  }
}

function assertUniqueNumbers(values: number[], path: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${path} contains duplicate sequences`);
}

function normalizeOption(value: unknown, path: string): NormalizedOption {
  const item = record(value, path);
  return {
    label: nonEmptyString(item.label, `${path}.label`),
    content: nonEmptyString(first(item, "content", "text"), `${path}.content`),
    isCorrect: (() => {
      if (typeof item.isCorrect !== "boolean") throw new Error(`${path}.isCorrect must be a boolean`);
      return item.isCorrect;
    })(),
  };
}

function normalizePairs(value: unknown, path: string): NormalizedPair[] {
  const pairs = array(value, path).map((entry, index) => {
    const item = record(entry, `${path}[${index}]`);
    return {
      leftText: nonEmptyString(item.leftText, `${path}[${index}].leftText`),
      rightText: nonEmptyString(item.rightText, `${path}[${index}].rightText`),
      sequence: integer(item.sequence, `${path}[${index}].sequence`),
    };
  });
  assertUniqueNumbers(pairs.map((pair) => pair.sequence), `${path}.sequence`);
  assertUnique(pairs.map((pair) => pair.leftText), `${path}.leftText`);
  assertUnique(pairs.map((pair) => pair.rightText), `${path}.rightText`);
  assertUnique(
    pairs.map((pair) => `${pair.leftText}\u0000${pair.rightText}`),
    `${path}.pairs`,
  );
  if (pairs.length === 0) throw new Error(`${path} must not be empty`);
  return pairs;
}

function normalizeBlanks(value: unknown, path: string): NormalizedBlank[] {
  const blanks = array(value, path).map((entry, index) => {
    const item = record(entry, `${path}[${index}]`);
    const blankOptions = item.options === undefined
      ? []
      : array(item.options, `${path}[${index}].options`).map((option, optionIndex) => {
          const optionRecord = record(option, `${path}[${index}].options[${optionIndex}]`);
          if (typeof optionRecord.isCorrect !== "boolean") {
            throw new Error(`${path}[${index}].options[${optionIndex}].isCorrect must be a boolean`);
          }
          return {
            text: nonEmptyString(optionRecord.text, `${path}[${index}].options[${optionIndex}].text`),
            isCorrect: optionRecord.isCorrect,
          };
        });
    const answer = optionalString(item.answer, `${path}[${index}].answer`)
      ?? blankOptions.find((option) => option.isCorrect)?.text;
    if (!answer) throw new Error(`${path}[${index}] needs an answer`);
    if (blankOptions.length > 0 && blankOptions.filter((option) => option.isCorrect).length !== 1) {
      throw new Error(`${path}[${index}] must have exactly one correct option`);
    }
    return {
      sequence: integer(item.sequence, `${path}[${index}].sequence`),
      placeholder: optionalString(item.placeholder, `${path}[${index}].placeholder`),
      answer,
      options: blankOptions,
    };
  });
  assertUniqueNumbers(blanks.map((blank) => blank.sequence), `${path}.sequence`);
  if (blanks.length === 0) throw new Error(`${path} must not be empty`);
  return blanks;
}

function normalizeQuestion(value: unknown, index: number): NormalizedQuestion {
  const path = `questions[${index}]`;
  const item = record(value, path);
  const type = nonEmptyString(item.type, `${path}.type`) as NormalizedQuestion["type"];
  if (!["multiple_choice", "true_false", "fill_in_the_blank", "matching"].includes(type)) {
    throw new Error(`${path}.type is not supported`);
  }
  const difficulty = nonEmptyString(item.difficulty, `${path}.difficulty`) as NormalizedQuestion["difficulty"];
  if (!["basic", "intermediate", "advanced"].includes(difficulty)) {
    throw new Error(`${path}.difficulty is not supported`);
  }

  const options = item.options === undefined ? [] : array(item.options, `${path}.options`).map((option, optionIndex) =>
    normalizeOption(option, `${path}.options[${optionIndex}]`),
  );
  const matchingPairs = item.matchingPairs === undefined
    ? []
    : normalizePairs(item.matchingPairs, `${path}.matchingPairs`);
  const fillInBlanks = item.fillInBlanks === undefined
    ? []
    : normalizeBlanks(item.fillInBlanks, `${path}.fillInBlanks`);

  if (type === "multiple_choice") {
    if (options.length === 0 || options.filter((option) => option.isCorrect).length !== 1) {
      throw new Error(`${path}.options must contain exactly one correct option`);
    }
  }
  if (type === "true_false") {
    if (options.length !== 2 || options.filter((option) => option.isCorrect).length !== 1) {
      throw new Error(`${path}.options must contain exactly two options and one correct option`);
    }
    const portugueseOptions = new Set(options.map((option) => option.content.toLocaleLowerCase("pt-BR")));
    if (
      portugueseOptions.size !== 2 ||
      !portugueseOptions.has("verdadeiro") ||
      !portugueseOptions.has("falso")
    ) {
      throw new Error(`${path}.options must be the Portuguese Verdadeiro/Falso pair`);
    }
  }
  if (type === "fill_in_the_blank" && fillInBlanks.length === 0) {
    throw new Error(`${path}.fillInBlanks must not be empty`);
  }
  if (type === "matching" && matchingPairs.length === 0) {
    throw new Error(`${path}.matchingPairs must not be empty`);
  }

  return {
    sourceKey: sourceKey(item, path),
    prompt: nonEmptyString(item.prompt, `${path}.prompt`),
    explanation: optionalString(item.explanation, `${path}.explanation`),
    type,
    difficulty,
    options,
    fillInBlanks,
    matchingPairs,
    references: item.references === undefined
      ? null
      : array(item.references, `${path}.references`),
  };
}

function normalizeArticle(value: unknown, index: number): NormalizedArticle {
  const path = `articles[${index}]`;
  const item = record(value, path);
  const content = array(item.content ?? item.blocks, `${path}.content`);
  if (content.length === 0) throw new Error(`${path}.content must not be empty`);
  return {
    sourceKey: sourceKey(item, path),
    title: nonEmptyString(item.title, `${path}.title`),
    slug: nonEmptyString(item.slug, `${path}.slug`),
    icon: optionalString(item.icon, `${path}.icon`),
    content,
    contentText: nonEmptyString(item.contentText, `${path}.contentText`),
    excerpt: optionalString(item.excerpt, `${path}.excerpt`),
    readingTimeMinutes: item.readingTimeMinutes === undefined || item.readingTimeMinutes === null
      ? calculateReadingTime(nonEmptyString(item.contentText, `${path}.contentText`))
      : optionalInteger(item.readingTimeMinutes, `${path}.readingTimeMinutes`, 1),
  };
}

function normalizeQuiz(value: unknown, index: number): NormalizedQuiz {
  const path = `quizzes[${index}]`;
  const item = record(value, path);
  const difficulty = nonEmptyString(item.difficulty, `${path}.difficulty`) as NormalizedQuiz["difficulty"];
  if (!["basic", "intermediate", "advanced", "mixed"].includes(difficulty)) {
    throw new Error(`${path}.difficulty is not supported`);
  }
  const rawQuestions = item.questions ?? item.quizQuestions ?? item.questionSourceKeys;
  const quizQuestions = array(rawQuestions, `${path}.questions`).map((entry, questionIndex) => {
    const question = optionalRecord(entry);
    if (!question) {
      return {
        questionSourceKey: nonEmptyString(entry, `${path}.questions[${questionIndex}].questionSourceKey`),
        order: questionIndex + 1,
        points: 1,
        required: true,
      };
    }
    return {
      questionSourceKey: nonEmptyString(
        first(question, "questionSourceKey", "questionKey", "sourceKey", "key", "questionId"),
        `${path}.questions[${questionIndex}].questionSourceKey`,
      ),
      order: integer(first(question, "order", "sequence") ?? questionIndex + 1, `${path}.questions[${questionIndex}].order`, 1),
      points: integer(question.points ?? 1, `${path}.questions[${questionIndex}].points`, 1),
      required: optionalBoolean(question.required, `${path}.questions[${questionIndex}].required`, true),
    };
  });
  assertUniqueNumbers(quizQuestions.map((question) => question.order), `${path}.questions.order`);
  if (quizQuestions.length === 0) throw new Error(`${path}.questions must not be empty`);
  return {
    sourceKey: sourceKey(item, path),
    title: nonEmptyString(item.title, `${path}.title`),
    description: optionalString(item.description, `${path}.description`),
    instructions: optionalString(item.instructions, `${path}.instructions`),
    difficulty,
    timeLimit: optionalInteger(item.timeLimit, `${path}.timeLimit`, 1),
    maxAttempts: optionalInteger(item.maxAttempts ?? 3, `${path}.maxAttempts`, 1),
    showResults: optionalBoolean(item.showResults, `${path}.showResults`, true),
    showCorrectAnswers: optionalBoolean(item.showCorrectAnswers, `${path}.showCorrectAnswers`, true),
    randomizeQuestions: optionalBoolean(item.randomizeQuestions, `${path}.randomizeQuestions`, false),
    randomizeOptions: optionalBoolean(item.randomizeOptions, `${path}.randomizeOptions`, false),
    passingScore: item.passingScore === null
      ? null
      : numberInRange(item.passingScore ?? 70, `${path}.passingScore`, 0, 100),
    imageUrl: optionalString(item.imageUrl, `${path}.imageUrl`),
    questions: quizQuestions,
  };
}

function normalizeTrail(value: unknown, index: number): NormalizedTrail {
  const path = `trails[${index}]`;
  const item = record(value, path);
  const trailId = nonEmptyString(first(item, "trailId", "trail_id"), `${path}.trailId`);
  const content = array(first(item, "content", "contents", "contentItems"), `${path}.content`).map((entry, contentIndex) => {
    const contentItem = record(entry, `${path}.content[${contentIndex}]`);
    const type = nonEmptyString(first(contentItem, "type", "contentType"), `${path}.content[${contentIndex}].type`) as NormalizedTrailContent["type"];
    if (!["article", "question", "quiz"].includes(type)) throw new Error(`${path}.content[${contentIndex}].type is not supported`);
    return {
      type,
      sourceKey: nonEmptyString(
        first(
          contentItem,
          "sourceKey",
          "source_key",
          "key",
          "contentSourceKey",
          "contentKey",
          "contentId",
          `${type}SourceKey`,
        ),
        `${path}.content[${contentIndex}].sourceKey`,
      ),
      sequence: integer(contentItem.sequence, `${path}.content[${contentIndex}].sequence`),
      isRequired: optionalBoolean(contentItem.isRequired, `${path}.content[${contentIndex}].isRequired`, true),
    };
  });
  assertUniqueNumbers(content.map((entry) => entry.sequence), `${path}.content.sequence`);
  if (content.length === 0) throw new Error(`${path}.content must not be empty`);
  return {
    sourceKey: sourceKey(item, path),
    trailId,
    name: nonEmptyString(item.name, `${path}.name`),
    description: optionalString(item.description, `${path}.description`),
    difficulty: (() => {
      const difficulty = nonEmptyString(item.difficulty, `${path}.difficulty`) as NormalizedTrail["difficulty"];
      if (!["basic", "intermediate", "advanced"].includes(difficulty)) throw new Error(`${path}.difficulty is not supported`);
      return difficulty;
    })(),
    unlockOrder: optionalInteger(item.unlockOrder, `${path}.unlockOrder`),
    passPercentage: numberInRange(item.passPercentage ?? 70, `${path}.passPercentage`, 0, 100),
    attemptsAllowed: optionalInteger(item.attemptsAllowed, `${path}.attemptsAllowed`, 1),
    timeLimitMinutes: optionalInteger(item.timeLimitMinutes, `${path}.timeLimitMinutes`, 1),
    allowSkipQuestions: optionalBoolean(item.allowSkipQuestions, `${path}.allowSkipQuestions`, false),
    showImmediateExplanations: optionalBoolean(item.showImmediateExplanations, `${path}.showImmediateExplanations`, true),
    randomizeContentOrder: optionalBoolean(item.randomizeContentOrder, `${path}.randomizeContentOrder`, false),
    themeColor: optionalString(item.themeColor, `${path}.themeColor`),
    estimatedTimeMinutes: optionalInteger(item.estimatedTimeMinutes, `${path}.estimatedTimeMinutes`, 1),
    customCertificate: optionalBoolean(item.customCertificate, `${path}.customCertificate`, false),
    content,
  };
}

function manifestObject(input: unknown): RawRecord {
  const root = record(input, "manifest");
  const candidates = [
    root.default,
    root.rss2026Content,
    root.rss2026ContentManifest,
    root.RSS_2026_08_CONTENT,
    root.RSS_2026_08_MANIFEST,
    root.manifest,
    root.content,
    ...Object.values(root),
  ];
  for (const candidate of candidates) {
    if (optionalRecord(candidate) && (candidate as RawRecord).articles !== undefined) return candidate as RawRecord;
  }
  return root;
}

function normalizeBatchMetadata(root: RawRecord): BatchMetadata {
  const batchKey = nonEmptyString(root.batchKey, "batchKey");
  const categoryRecord = record(root.category, "category");
  const tagRecord = record(root.batchTag ?? root.tag, "batchTag");
  return {
    batchKey,
    category: {
      name: nonEmptyString(first(categoryRecord, "name", "title"), "category.name"),
      slug: nonEmptyString(categoryRecord.slug, "category.slug"),
    },
    tag: {
      name: nonEmptyString(tagRecord.name, "batchTag.name"),
      slug: nonEmptyString(tagRecord.slug, "batchTag.slug"),
    },
  };
}

/** Normalizes and validates the static manifest before a DB transaction is opened. */
export function validateManifest(input: unknown): NormalizedManifest {
  const root = manifestObject(input);
  const metadata = normalizeBatchMetadata(root);
  const articles = array(root.articles, "articles").map(normalizeArticle);
  const questionsList = array(root.questions, "questions").map(normalizeQuestion);
  const quizzesList = array(root.quizzes, "quizzes").map(normalizeQuiz);
  const rawTrails = root.trails === undefined
    ? (Array.isArray(root.trail) ? root.trail : [root.trail])
    : array(root.trails, "trails");
  const trailsList = rawTrails.map(normalizeTrail);

  const rawTrail = record(rawTrails[0], "trail");
  if (rawTrail.categorySlug !== undefined && rawTrail.categorySlug !== metadata.category.slug) {
    throw new Error("trail.categorySlug does not match category.slug");
  }
  if (rawTrail.tagSlug !== undefined && rawTrail.tagSlug !== metadata.tag.slug) {
    throw new Error("trail.tagSlug does not match batchTag.slug");
  }

  if (articles.length !== 8) throw new Error(`Manifest must contain exactly 8 articles; found ${articles.length}`);
  if (quizzesList.length !== 5) throw new Error(`Manifest must contain exactly 5 quizzes; found ${quizzesList.length}`);
  if (questionsList.length !== 46) throw new Error(`Manifest must contain exactly 46 questions; found ${questionsList.length}`);
  if (trailsList.length !== 1) throw new Error(`Manifest must contain exactly 1 trail; found ${trailsList.length}`);

  const allSourceKeys = [
    ...articles.map((item) => item.sourceKey),
    ...questionsList.map((item) => item.sourceKey),
    ...quizzesList.map((item) => item.sourceKey),
    ...trailsList.map((item) => item.sourceKey),
  ];
  assertUnique(allSourceKeys, "manifest sourceKey");
  assertUnique(articles.map((item) => item.slug), "article slug");
  assertUnique(trailsList.map((item) => item.trailId), "trailId");

  const questionKeys = new Set(questionsList.map((item) => item.sourceKey));
  const articleKeys = new Set(articles.map((item) => item.sourceKey));
  const quizKeys = new Set(quizzesList.map((item) => item.sourceKey));
  for (const quiz of quizzesList) {
    for (const question of quiz.questions) {
      if (!questionKeys.has(question.questionSourceKey)) {
        throw new Error(`Quiz ${quiz.sourceKey} references unknown question ${question.questionSourceKey}`);
      }
    }
  }
  for (const trail of trailsList) {
    for (const item of trail.content) {
      const known = item.type === "article" ? articleKeys : item.type === "question" ? questionKeys : quizKeys;
      if (!known.has(item.sourceKey)) throw new Error(`Trail ${trail.sourceKey} references unknown ${item.type} ${item.sourceKey}`);
    }
  }

  return {
    batchKey: metadata.batchKey,
    articles,
    questions: questionsList,
    quizzes: quizzesList,
    trails: trailsList,
    category: metadata.category,
    tag: metadata.tag,
  };
}

function canonical(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value as object).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as RawRecord)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function equalStable(left: unknown, right: unknown): boolean {
  return canonical(left) === canonical(right);
}

function manifestSha256(manifest: NormalizedManifest): string {
  return createHash("sha256").update(canonical(manifest)).digest("hex");
}

function batchMarker(manifest: NormalizedManifest, sha256: string): string {
  return `content-import:v1;batch=${manifest.batchKey};sha256=${sha256}`;
}

function articleStable(item: NormalizedArticle, categoryId: number, authorId: string) {
  return {
    title: item.title,
    slug: item.slug,
    icon: item.icon,
    sourceType: "original",
    content: item.content,
    contentText: item.contentText,
    excerpt: item.excerpt,
    readingTimeMinutes: item.readingTimeMinutes,
    categoryId,
    authorId,
  };
}

function articleDbStable(item: any) {
  return {
    title: item.title,
    slug: item.slug,
    icon: item.icon,
    sourceType: item.sourceType,
    content: item.content,
    contentText: item.contentText,
    excerpt: item.excerpt,
    readingTimeMinutes: item.readingTimeMinutes,
    categoryId: item.categoryId,
    authorId: item.authorId,
  };
}

function questionStable(item: NormalizedQuestion, categoryId: number, authorId: string) {
  return {
    prompt: item.prompt,
    explanation: item.explanation,
    type: item.type,
    difficulty: item.difficulty,
    categoryId,
    authorId,
    imageUrl: null,
    imageKey: null,
    references: item.references,
  };
}

function questionDbStable(item: any) {
  return {
    prompt: item.prompt,
    explanation: item.explanation,
    type: item.type,
    difficulty: item.difficulty,
    categoryId: item.categoryId,
    authorId: item.authorId,
    imageUrl: item.imageUrl,
    imageKey: item.imageKey,
    references: item.references,
  };
}

function quizStable(item: NormalizedQuiz, categoryId: number, authorId: string) {
  return {
    title: item.title,
    description: item.description,
    instructions: item.instructions,
    difficulty: item.difficulty,
    categoryId,
    authorId,
    timeLimit: item.timeLimit,
    maxAttempts: item.maxAttempts,
    showResults: item.showResults,
    showCorrectAnswers: item.showCorrectAnswers,
    randomizeQuestions: item.randomizeQuestions,
    randomizeOptions: item.randomizeOptions,
    passingScore: item.passingScore,
    imageUrl: item.imageUrl,
  };
}

function quizDbStable(item: any) {
  return {
    title: item.title,
    description: item.description,
    instructions: item.instructions,
    difficulty: item.difficulty,
    categoryId: item.categoryId,
    authorId: item.authorId,
    timeLimit: item.timeLimit,
    maxAttempts: item.maxAttempts,
    showResults: item.showResults,
    showCorrectAnswers: item.showCorrectAnswers,
    randomizeQuestions: item.randomizeQuestions,
    randomizeOptions: item.randomizeOptions,
    passingScore: item.passingScore,
    imageUrl: item.imageUrl,
  };
}

function trailStable(item: NormalizedTrail, categoryId: number, authorId: string) {
  return {
    trailId: item.trailId,
    name: item.name,
    description: item.description,
    categoryId,
    difficulty: item.difficulty,
    unlockOrder: item.unlockOrder,
    passPercentage: item.passPercentage,
    attemptsAllowed: item.attemptsAllowed,
    timeLimitMinutes: item.timeLimitMinutes,
    allowSkipQuestions: item.allowSkipQuestions,
    showImmediateExplanations: item.showImmediateExplanations,
    randomizeContentOrder: item.randomizeContentOrder,
    themeColor: item.themeColor,
    estimatedTimeMinutes: item.estimatedTimeMinutes,
    customCertificate: item.customCertificate,
    authorId,
  };
}

function trailDbStable(item: any) {
  return {
    trailId: item.trailId,
    name: item.name,
    description: item.description,
    categoryId: item.categoryId,
    difficulty: item.difficulty,
    unlockOrder: item.unlockOrder,
    passPercentage: item.passPercentage,
    attemptsAllowed: item.attemptsAllowed,
    timeLimitMinutes: item.timeLimitMinutes,
    allowSkipQuestions: item.allowSkipQuestions,
    showImmediateExplanations: item.showImmediateExplanations,
    randomizeContentOrder: item.randomizeContentOrder,
    themeColor: item.themeColor,
    estimatedTimeMinutes: item.estimatedTimeMinutes,
    customCertificate: item.customCertificate,
    authorId: item.authorId,
  };
}

function statusIsCompatible(kind: "article" | "question" | "quiz" | "trail", status: string): boolean {
  return status === "draft" ||
    (kind === "article" && status === "published") ||
    ((kind === "question" || kind === "quiz") && status === "active") ||
    (kind === "trail" && status === "published");
}

function statusIsAllowed(
  kind: "article" | "question" | "quiz" | "trail",
  status: string,
  allowQuarantined: boolean,
): boolean {
  return statusIsCompatible(kind, status) ||
    (allowQuarantined && ((kind === "article" && status === "archived") ||
      ((kind === "question" || kind === "quiz" || kind === "trail") && status === "inactive")));
}

async function getOrCreateCategory(
  tx: DbTransaction,
  manifest: NormalizedManifest,
  sha256: string,
  mutate: boolean,
): Promise<number | null> {
  const expected = {
    name: manifest.category.name,
    slug: manifest.category.slug,
    description: batchMarker(manifest, sha256),
    color: null,
    isActive: true,
  };
  let [category] = await tx.select().from(contentCategories).where(eq(contentCategories.slug, manifest.category.slug)).limit(1);
  if (!category) {
    const [sameName] = await tx.select({ id: contentCategories.id }).from(contentCategories).where(eq(contentCategories.name, manifest.category.name)).limit(1);
    if (sameName) throw new Error(`Category ${manifest.category.name} exists with a different slug`);
  }
  if (!category && mutate) {
    await tx.insert(contentCategories).values(expected).onConflictDoNothing({ target: contentCategories.slug });
    [category] = await tx.select().from(contentCategories).where(eq(contentCategories.slug, manifest.category.slug)).limit(1);
  }
  if (!category) return null;
  if (!equalStable(
    { name: category.name, slug: category.slug, description: category.description, color: category.color, isActive: category.isActive },
    expected,
  )) throw new Error(`Batch category ${manifest.category.slug} exists with different data`);
  return category.id;
}

async function getOrCreateTag(
  tx: DbTransaction,
  manifest: NormalizedManifest,
  sha256: string,
  mutate: boolean,
): Promise<number | null> {
  const expected = {
    name: manifest.tag.name,
    slug: manifest.tag.slug,
    description: batchMarker(manifest, sha256),
    color: null,
  };
  let [tag] = await tx.select().from(tags).where(eq(tags.slug, manifest.tag.slug)).limit(1);
  if (!tag) {
    const [sameName] = await tx.select({ id: tags.id }).from(tags).where(eq(tags.name, manifest.tag.name)).limit(1);
    if (sameName) throw new Error(`Tag ${manifest.tag.name} exists with a different slug`);
  }
  if (!tag && mutate) {
    await tx.insert(tags).values(expected).onConflictDoNothing({ target: tags.slug });
    [tag] = await tx.select().from(tags).where(eq(tags.slug, manifest.tag.slug)).limit(1);
  }
  if (!tag) return null;
  if (!equalStable(
    { name: tag.name, slug: tag.slug, description: tag.description, color: tag.color },
    expected,
  )) throw new Error(`Batch tag ${manifest.tag.slug} exists with different data`);
  return tag.id;
}

async function requireAuthor(tx: DbTransaction, authorId: string): Promise<void> {
  const [author] = await tx.select({ id: user.id }).from(user).where(eq(user.id, authorId)).limit(1);
  if (!author) throw new Error("CONTENT_IMPORT_AUTHOR_ID does not identify an existing user");
}

async function lockBatch(tx: DbTransaction, batchKey: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${batchKey}))`);
}

async function questionSnapshot(tx: DbTransaction, id: number) {
  const [question] = await tx.select().from(questions).where(eq(questions.id, id)).limit(1);
  if (!question) throw new Error(`Question ${id} disappeared during import`);
  const options = await tx.select().from(questionOptions).where(eq(questionOptions.questionId, id)).orderBy(asc(questionOptions.id));
  const blanks = await tx.select().from(questionFillBlankAnswers).where(eq(questionFillBlankAnswers.questionId, id)).orderBy(asc(questionFillBlankAnswers.sequence));
  const blankOptions = blanks.length === 0
    ? []
    : await tx.select().from(questionFillBlankOptions).where(
        inArray(questionFillBlankOptions.blankId, blanks.map((blank: any) => blank.id)),
      ).orderBy(asc(questionFillBlankOptions.id));
  const pairs = await tx.select().from(questionMatchingPairs).where(eq(questionMatchingPairs.questionId, id)).orderBy(asc(questionMatchingPairs.sequence));
  return { question, options, blanks, blankOptions, pairs };
}

function questionChildrenStable(input: NormalizedQuestion) {
  return {
    options: [...input.options]
      .sort((left, right) => left.label.localeCompare(right.label))
      .map(({ label, content, isCorrect }) => ({ label, content, isCorrect })),
    blanks: [...input.fillInBlanks]
      .sort((left, right) => left.sequence - right.sequence)
      .map((blank) => ({
      sequence: blank.sequence,
      placeholder: blank.placeholder,
      answer: blank.answer,
      options: [...blank.options].sort((left, right) => left.text.localeCompare(right.text)),
      })),
    pairs: [...input.matchingPairs].sort((left, right) => left.sequence - right.sequence),
  };
}

function questionDbChildrenStable(snapshot: any) {
  return {
    options: [...snapshot.options]
      .sort((left: any, right: any) => left.label.localeCompare(right.label))
      .map((option: any) => ({ label: option.label, content: option.content, isCorrect: option.isCorrect })),
    blanks: snapshot.blanks.map((blank: any) => ({
      sequence: blank.sequence,
      placeholder: blank.placeholder,
      answer: blank.answer,
      options: snapshot.blankOptions
        .filter((option: any) => option.blankId === blank.id)
        .sort((left: any, right: any) => left.text.localeCompare(right.text))
        .map((option: any) => ({ text: option.text, isCorrect: option.isCorrect })),
    })),
    pairs: snapshot.pairs.map((pair: any) => ({ leftText: pair.leftText, rightText: pair.rightText, sequence: pair.sequence })),
  };
}

async function createQuestion(tx: DbTransaction, input: NormalizedQuestion, categoryId: number, authorId: string, tagId: number): Promise<number> {
  const [question] = await tx.insert(questions).values({
    prompt: input.prompt,
    explanation: input.explanation,
    type: input.type,
    difficulty: input.difficulty,
    status: "draft",
    categoryId,
    authorId,
    imageUrl: null,
    imageKey: null,
    references: input.references as any,
  }).returning();
  if (!question) throw new Error(`Could not create question ${input.sourceKey}`);
  if (input.options.length > 0) {
    await tx.insert(questionOptions).values(input.options.map((option) => ({ questionId: question.id, ...option })));
  }
  for (const blank of input.fillInBlanks) {
    const [createdBlank] = await tx.insert(questionFillBlankAnswers).values({
      questionId: question.id,
      sequence: blank.sequence,
      placeholder: blank.placeholder,
      answer: blank.answer,
    }).returning();
    if (!createdBlank) throw new Error(`Could not create blank for question ${input.sourceKey}`);
    if (blank.options.length > 0) {
      await tx.insert(questionFillBlankOptions).values(blank.options.map((option) => ({ blankId: createdBlank.id, ...option })));
    }
  }
  if (input.matchingPairs.length > 0) {
    await tx.insert(questionMatchingPairs).values(input.matchingPairs.map((pair) => ({ questionId: question.id, ...pair })));
  }
  await tx.insert(questionTags).values({ questionId: question.id, tagId, assignedBy: authorId });
  return question.id;
}

async function resolveQuestions(
  tx: DbTransaction,
  manifest: NormalizedManifest,
  categoryId: number | null,
  authorId: string,
  tagId: number | null,
  mutate: boolean,
  allowQuarantined: boolean,
): Promise<{ ids: Record<string, number>; statuses: Record<string, string | null>; created: number; reused: number }> {
  const taggedIds = tagId === null
    ? []
    : await tx.select({ id: questionTags.questionId }).from(questionTags).where(eq(questionTags.tagId, tagId));
  const tagged = taggedIds.length === 0
    ? []
    : await tx.select().from(questions).where(inArray(questions.id, taggedIds.map((row: any) => row.id)));
  const snapshots = await Promise.all(tagged.map((row: any) => questionSnapshot(tx, row.id)));
  const used = new Set<number>();
  const ids: Record<string, number> = {};
  const statuses: Record<string, string | null> = {};
  const missing: NormalizedQuestion[] = [];
  let created = 0;
  let reused = 0;

  for (const input of manifest.questions) {
    const matchIndex = snapshots.findIndex((snapshot: any, index: number) =>
      !used.has(index) &&
      categoryId !== null &&
      tagId !== null &&
      statusIsAllowed("question", snapshot.question.status, allowQuarantined) &&
      equalStable(questionDbStable(snapshot.question), questionStable(input, categoryId, authorId)) &&
      equalStable(questionDbChildrenStable(snapshot), questionChildrenStable(input)),
    );
    if (matchIndex >= 0) {
      used.add(matchIndex);
      ids[input.sourceKey] = tagged[matchIndex]!.id;
      statuses[input.sourceKey] = tagged[matchIndex]!.status;
      reused++;
      continue;
    }
    missing.push(input);
  }
  if (used.size !== tagged.length) throw new Error("Batch tag contains a question with drift or an unexpected question");
  if (missing.length > 0) {
    const existing = await tx.select({ id: questions.id }).from(questions).where(
      inArray(questions.prompt, missing.map((input) => input.prompt)),
    );
    const taggedIdsSet = new Set(tagged.map((row: any) => row.id));
    if (existing.some((row: any) => !taggedIdsSet.has(row.id))) {
      throw new Error("A question prompt exists outside this batch or has drifted");
    }
  }
  for (const input of missing) {
    if (mutate) {
      if (categoryId === null || tagId === null) throw new Error(`Question ${input.sourceKey} cannot be created without category and tag`);
      ids[input.sourceKey] = await createQuestion(tx, input, categoryId, authorId, tagId);
      statuses[input.sourceKey] = "draft";
    }
    created++;
  }
  return { ids, statuses, created, reused };
}

async function createArticle(tx: DbTransaction, input: NormalizedArticle, categoryId: number, authorId: string, tagId: number): Promise<number> {
  const [article] = await tx.insert(wikiArticles).values({
    title: input.title,
    slug: input.slug,
    icon: input.icon,
    sourceType: "original",
    content: input.content,
    contentText: input.contentText,
    excerpt: input.excerpt,
    readingTimeMinutes: input.readingTimeMinutes,
    status: "draft",
    categoryId,
    authorId,
  }).returning();
  if (!article) throw new Error(`Could not create article ${input.sourceKey}`);
  await tx.insert(wikiArticleTags).values({ articleId: article.id, tagId, assignedBy: authorId });
  return article.id;
}

async function resolveArticles(
  tx: DbTransaction,
  manifest: NormalizedManifest,
  categoryId: number | null,
  authorId: string,
  tagId: number | null,
  mutate: boolean,
  allowQuarantined: boolean,
): Promise<{ ids: Record<string, number>; statuses: Record<string, string | null>; created: number; reused: number }> {
  const taggedIds = tagId === null
    ? []
    : await tx.select({ id: wikiArticleTags.articleId }).from(wikiArticleTags).where(eq(wikiArticleTags.tagId, tagId));
  const tagged = taggedIds.length === 0
    ? []
    : await tx.select().from(wikiArticles).where(inArray(wikiArticles.id, taggedIds.map((row: any) => row.id)));
  const used = new Set<number>();
  const ids: Record<string, number> = {};
  const statuses: Record<string, string | null> = {};
  const missing: NormalizedArticle[] = [];
  let created = 0;
  let reused = 0;
  for (const input of manifest.articles) {
    const matchIndex = tagged.findIndex((row: any, index: number) =>
      !used.has(index) &&
      categoryId !== null &&
      tagId !== null &&
      statusIsAllowed("article", row.status, allowQuarantined) &&
      equalStable(articleDbStable(row), articleStable(input, categoryId, authorId)),
    );
    if (matchIndex >= 0) {
      used.add(matchIndex);
      ids[input.sourceKey] = tagged[matchIndex]!.id;
      statuses[input.sourceKey] = tagged[matchIndex]!.status;
      reused++;
    } else {
      missing.push(input);
    }
  }
  if (used.size !== tagged.length) throw new Error("Batch tag contains an article with drift or an unexpected article");
  if (missing.length > 0) {
    const existing = await tx.select({ id: wikiArticles.id }).from(wikiArticles).where(
      inArray(wikiArticles.slug, missing.map((input) => input.slug)),
    );
    const taggedIdsSet = new Set(tagged.map((row: any) => row.id));
    if (existing.some((row: any) => !taggedIdsSet.has(row.id))) {
      throw new Error("An article slug exists outside this batch or has drifted");
    }
  }
  for (const input of missing) {
    if (mutate) {
      if (categoryId === null || tagId === null) throw new Error(`Article ${input.sourceKey} cannot be created without category and tag`);
      ids[input.sourceKey] = await createArticle(tx, input, categoryId, authorId, tagId);
      statuses[input.sourceKey] = "draft";
    }
    created++;
  }
  return { ids, statuses, created, reused };
}

async function quizSnapshot(tx: DbTransaction, id: number) {
  const [quiz] = await tx.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
  if (!quiz) throw new Error(`Quiz ${id} disappeared during import`);
  const links = await tx.select().from(quizQuestions).where(eq(quizQuestions.quizId, id)).orderBy(asc(quizQuestions.order));
  return { quiz, links };
}

function quizChildrenStable(input: NormalizedQuiz, questionIds: Record<string, number>) {
  return [...input.questions].sort((left, right) => left.order - right.order).map((question) => ({
    questionId: questionIds[question.questionSourceKey] ?? null,
    order: question.order,
    points: question.points,
    required: question.required,
  }));
}

function quizDbChildrenStable(snapshot: any) {
  return snapshot.links.map((link: any) => ({ questionId: link.questionId, order: link.order, points: link.points, required: link.required }));
}

async function createQuiz(tx: DbTransaction, input: NormalizedQuiz, categoryId: number, authorId: string, tagId: number, questionIds: Record<string, number>): Promise<number> {
  const [quiz] = await tx.insert(quizzes).values({
    title: input.title,
    description: input.description,
    instructions: input.instructions,
    difficulty: input.difficulty,
    status: "draft",
    categoryId,
    authorId,
    timeLimit: input.timeLimit,
    maxAttempts: input.maxAttempts,
    showResults: input.showResults,
    showCorrectAnswers: input.showCorrectAnswers,
    randomizeQuestions: input.randomizeQuestions,
    randomizeOptions: input.randomizeOptions,
    passingScore: input.passingScore,
    imageUrl: input.imageUrl,
  }).returning();
  if (!quiz) throw new Error(`Could not create quiz ${input.sourceKey}`);
  await tx.insert(quizQuestions).values(input.questions.map((question) => ({
    quizId: quiz.id,
    questionId: questionIds[question.questionSourceKey]!,
    order: question.order,
    points: question.points,
    required: question.required,
  })));
  await tx.insert(quizTags).values({ quizId: quiz.id, tagId, assignedBy: authorId });
  return quiz.id;
}

async function resolveQuizzes(
  tx: DbTransaction,
  manifest: NormalizedManifest,
  categoryId: number | null,
  authorId: string,
  tagId: number | null,
  questionIds: Record<string, number>,
  mutate: boolean,
  allowQuarantined: boolean,
): Promise<{ ids: Record<string, number>; statuses: Record<string, string | null>; created: number; reused: number }> {
  const taggedIds = tagId === null
    ? []
    : await tx.select({ id: quizTags.quizId }).from(quizTags).where(eq(quizTags.tagId, tagId));
  const tagged = taggedIds.length === 0
    ? []
    : await tx.select().from(quizzes).where(inArray(quizzes.id, taggedIds.map((row: any) => row.id)));
  const snapshots = await Promise.all(tagged.map((row: any) => quizSnapshot(tx, row.id)));
  const used = new Set<number>();
  const ids: Record<string, number> = {};
  const statuses: Record<string, string | null> = {};
  const missing: NormalizedQuiz[] = [];
  let created = 0;
  let reused = 0;
  for (const input of manifest.quizzes) {
    const matchIndex = snapshots.findIndex((snapshot: any, index: number) =>
      !used.has(index) &&
      categoryId !== null &&
      tagId !== null &&
      statusIsAllowed("quiz", snapshot.quiz.status, allowQuarantined) &&
      equalStable(quizDbStable(snapshot.quiz), quizStable(input, categoryId, authorId)) &&
      equalStable(quizDbChildrenStable(snapshot), quizChildrenStable(input, questionIds)),
    );
    if (matchIndex >= 0) {
      used.add(matchIndex);
      ids[input.sourceKey] = tagged[matchIndex]!.id;
      statuses[input.sourceKey] = tagged[matchIndex]!.status;
      reused++;
    } else {
      missing.push(input);
    }
  }
  if (used.size !== tagged.length) throw new Error("Batch tag contains a quiz with drift or an unexpected quiz");
  if (missing.length > 0) {
    const existing = await tx.select({ id: quizzes.id }).from(quizzes).where(
      inArray(quizzes.title, missing.map((input) => input.title)),
    );
    const taggedIdsSet = new Set(tagged.map((row: any) => row.id));
    if (existing.some((row: any) => !taggedIdsSet.has(row.id))) {
      throw new Error("A quiz title exists outside this batch or has drifted");
    }
  }
  for (const input of missing) {
    if (mutate) {
      if (categoryId === null || tagId === null) throw new Error(`Quiz ${input.sourceKey} cannot be created without category and tag`);
      if (input.questions.some((question) => questionIds[question.questionSourceKey] === undefined)) {
        throw new Error(`Quiz ${input.sourceKey} cannot be created because a question was not resolved`);
      }
      ids[input.sourceKey] = await createQuiz(tx, input, categoryId, authorId, tagId, questionIds);
      statuses[input.sourceKey] = "draft";
    }
    created++;
  }
  return { ids, statuses, created, reused };
}

const trailContentIdKeys = {
  article: "articles",
  question: "questions",
  quiz: "quizzes",
} as const;

export function resolveTrailContentId(
  ids: Pick<ImportIds, "articles" | "questions" | "quizzes">,
  item: Pick<NormalizedTrailContent, "type" | "sourceKey">,
): number | undefined {
  return ids[trailContentIdKeys[item.type]][item.sourceKey];
}

function trailContentStable(input: NormalizedTrail, ids: ImportIds) {
  return [...input.content].sort((left, right) => left.sequence - right.sequence).map((item) => ({
    type: item.type,
    contentId: resolveTrailContentId(ids, item) ?? null,
    sequence: item.sequence,
    isRequired: item.isRequired,
  }));
}

function trailDbContentStable(content: any[], ids: ImportIds) {
  return content.map((item) => ({
    type: item.questionId !== null ? "question" : item.quizId !== null ? "quiz" : "article",
    contentId: item.questionId ?? item.quizId ?? item.articleId,
    sequence: item.sequence,
    isRequired: item.isRequired,
  }));
}

async function createTrail(tx: DbTransaction, input: NormalizedTrail, categoryId: number, authorId: string, ids: ImportIds): Promise<number> {
  const [trail] = await tx.insert(trails).values({
    trailId: input.trailId,
    name: input.name,
    description: input.description,
    categoryId,
    difficulty: input.difficulty,
    status: "draft",
    unlockOrder: input.unlockOrder,
    passPercentage: input.passPercentage,
    attemptsAllowed: input.attemptsAllowed,
    timeLimitMinutes: input.timeLimitMinutes,
    allowSkipQuestions: input.allowSkipQuestions,
    showImmediateExplanations: input.showImmediateExplanations,
    randomizeContentOrder: input.randomizeContentOrder,
    themeColor: input.themeColor,
    estimatedTimeMinutes: input.estimatedTimeMinutes,
    customCertificate: input.customCertificate,
    authorId,
  }).returning();
  if (!trail) throw new Error(`Could not create trail ${input.sourceKey}`);
  await tx.insert(trailContent).values(input.content.map((item) => ({
    trailId: trail.id,
    questionId: item.type === "question" ? ids.questions[item.sourceKey] : null,
    quizId: item.type === "quiz" ? ids.quizzes[item.sourceKey] : null,
    articleId: item.type === "article" ? ids.articles[item.sourceKey] : null,
    sequence: item.sequence,
    isRequired: item.isRequired,
  })));
  return trail.id;
}

async function resolveTrail(
  tx: DbTransaction,
  input: NormalizedTrail,
  categoryId: number | null,
  authorId: string,
  ids: ImportIds,
  mutate: boolean,
  allowQuarantined: boolean,
): Promise<{ id: number | null; status: string | null; created: number; reused: number }> {
  const [existing] = await tx.select().from(trails).where(eq(trails.trailId, input.trailId)).limit(1);
  if (existing) {
    if (
      categoryId === null ||
      !statusIsAllowed("trail", existing.status, allowQuarantined) ||
      !equalStable(trailDbStable(existing), trailStable(input, categoryId, authorId))
    ) {
      throw new Error(`Trail ${input.trailId} exists with different data`);
    }
    const content = await tx.select().from(trailContent).where(eq(trailContent.trailId, existing.id)).orderBy(asc(trailContent.sequence));
    if (!equalStable(trailDbContentStable(content, ids), trailContentStable(input, ids))) {
      throw new Error(`Trail ${input.trailId} content has drifted`);
    }
    return { id: existing.id, status: existing.status, created: 0, reused: 1 };
  }
  if (mutate) {
    if (categoryId === null) throw new Error(`Trail ${input.sourceKey} cannot be created without category`);
    const unresolved = input.content
      .filter((item) => resolveTrailContentId(ids, item) === undefined)
      .map((item) => `${item.type}:${item.sourceKey}`);
    if (unresolved.length > 0) {
      throw new Error(`Trail ${input.sourceKey} cannot be created because content was not resolved: ${unresolved.join(", ")}`);
    }
    return { id: await createTrail(tx, input, categoryId, authorId, ids), status: "draft", created: 1, reused: 0 };
  }
  return { id: null, status: null, created: 1, reused: 0 };
}

function emptyCounts(): ImportCounts {
  return { articles: 0, quizzes: 0, questions: 0, trails: 0 };
}

async function importPhase(
  tx: DbTransaction,
  manifest: NormalizedManifest,
  sha256: string,
  authorId: string,
  mutate: boolean,
  allowQuarantined: boolean,
): Promise<ImportPhaseResult> {
  await lockBatch(tx, manifest.batchKey);
  await requireAuthor(tx, authorId);
  const categoryId = await getOrCreateCategory(tx, manifest, sha256, mutate);
  const tagId = await getOrCreateTag(tx, manifest, sha256, mutate);
  const articles = await resolveArticles(tx, manifest, categoryId, authorId, tagId, mutate, allowQuarantined);
  const questionResult = await resolveQuestions(tx, manifest, categoryId, authorId, tagId, mutate, allowQuarantined);
  const quizResult = await resolveQuizzes(tx, manifest, categoryId, authorId, tagId, questionResult.ids, mutate, allowQuarantined);
  const ids: ImportIds = {
    articles: articles.ids,
    questions: questionResult.ids,
    quizzes: quizResult.ids,
    trails: {},
  };
  const trailResult = await resolveTrail(tx, manifest.trails[0]!, categoryId, authorId, ids, mutate, allowQuarantined);
  if (trailResult.id !== null) ids.trails[manifest.trails[0]!.sourceKey] = trailResult.id;
  const statuses: ImportStatuses = {
    articles: articles.statuses,
    questions: questionResult.statuses,
    quizzes: quizResult.statuses,
    trails: trailResult.id === null ? {} : { [manifest.trails[0]!.sourceKey]: trailResult.status },
  };

  const created = emptyCounts();
  created.articles = articles.created;
  created.questions = questionResult.created;
  created.quizzes = quizResult.created;
  created.trails = trailResult.created;
  const reused = emptyCounts();
  reused.articles = articles.reused;
  reused.questions = questionResult.reused;
  reused.quizzes = quizResult.reused;
  reused.trails = trailResult.reused;
  return {
    report: {
      batch: manifest.batchKey,
      manifestSha256: sha256,
      categoryId,
      tagId,
      warnings: [],
      counts: {
        articles: manifest.articles.length,
        quizzes: manifest.quizzes.length,
        questions: manifest.questions.length,
        trails: manifest.trails.length,
      },
      created,
      reused,
      ids: {
        articles: manifest.articles.map((item) => ({ sourceKey: item.sourceKey, id: articles.ids[item.sourceKey] ?? null, status: articles.statuses[item.sourceKey] ?? null })),
        questions: manifest.questions.map((item) => ({ sourceKey: item.sourceKey, id: questionResult.ids[item.sourceKey] ?? null, status: questionResult.statuses[item.sourceKey] ?? null })),
        quizzes: manifest.quizzes.map((item) => ({ sourceKey: item.sourceKey, id: quizResult.ids[item.sourceKey] ?? null, status: quizResult.statuses[item.sourceKey] ?? null })),
        trails: manifest.trails.map((item) => ({ sourceKey: item.sourceKey, id: trailResult.id, status: trailResult.status })),
      },
    },
    ids,
    statuses,
  };
}

function emptyStatuses(): ImportStatuses {
  return { articles: {}, questions: {}, quizzes: {}, trails: {} };
}

function actualStateCounts(statuses: ImportStatuses): ImportReport["states"] {
  const states: ImportReport["states"] = {
    articles: {},
    questions: {},
    quizzes: {},
    trails: {},
  };
  for (const kind of ["articles", "questions", "quizzes", "trails"] as const) {
    for (const status of Object.values(statuses[kind])) {
      if (status) states[kind][status] = (states[kind][status] ?? 0) + 1;
    }
  }
  return states;
}

function reportWithActualStates(phase: ImportPhaseResult, statuses: ImportStatuses) {
  return {
    ...phase.report,
    states: actualStateCounts(statuses),
    ids: {
      articles: phase.report.ids.articles.map(({ sourceKey, id }) => ({ sourceKey, id, status: statuses.articles[sourceKey] ?? null })),
      questions: phase.report.ids.questions.map(({ sourceKey, id }) => ({ sourceKey, id, status: statuses.questions[sourceKey] ?? null })),
      quizzes: phase.report.ids.quizzes.map(({ sourceKey, id }) => ({ sourceKey, id, status: statuses.quizzes[sourceKey] ?? null })),
      trails: phase.report.ids.trails.map(({ sourceKey, id }) => ({ sourceKey, id, status: statuses.trails[sourceKey] ?? null })),
    },
  };
}

function assertCompletePhase(phase: ImportPhaseResult, operation: string): void {
  if (Object.values(phase.report.created).some((count) => count !== 0)) {
    throw new Error(`Cannot ${operation}: the complete batch is not present`);
  }
  for (const kind of ["articles", "questions", "quizzes", "trails"] as const) {
    if (Object.keys(phase.ids[kind]).length !== phase.report.counts[kind]) {
      throw new Error(`Cannot ${operation}: ${kind} are missing from the owned batch`);
    }
  }
}

async function refreshStatuses(tx: DbTransaction, ids: ImportIds): Promise<ImportStatuses> {
  const statuses = emptyStatuses();
  const tables = {
    articles: { table: wikiArticles, id: wikiArticles.id, status: wikiArticles.status },
    questions: { table: questions, id: questions.id, status: questions.status },
    quizzes: { table: quizzes, id: quizzes.id, status: quizzes.status },
    trails: { table: trails, id: trails.id, status: trails.status },
  } as const;
  for (const kind of ["articles", "questions", "quizzes", "trails"] as const) {
    const values = Object.entries(ids[kind]);
    if (values.length === 0) continue;
    const rows = await tx.select({ id: tables[kind].id, status: tables[kind].status })
      .from(tables[kind].table)
      .where(inArray(tables[kind].id, values.map(([, id]) => id)));
    const byId = new Map<number, string>(rows.map((row: any): [number, string] => [row.id, row.status]));
    for (const [sourceKey, id] of values) statuses[kind][sourceKey] = byId.get(id) ?? null;
  }
  return statuses;
}

async function publishPhase(
  manifest: NormalizedManifest,
  sha256: string,
  authorId: string,
): Promise<ImportPhaseResult> {
  return db.transaction(async (tx: DbTransaction): Promise<ImportPhaseResult> => {
    await lockBatch(tx, manifest.batchKey);
    await requireAuthor(tx, authorId);
    // This is a separate transaction from apply. It verifies all children and
    // the marker before changing any publication state.
    const phase = await importPhase(tx, manifest, sha256, authorId, false, false);
    assertCompletePhase(phase, "publish");
    for (const item of manifest.articles) {
      const id = phase.ids.articles[item.sourceKey]!;
      const [row] = await tx.select().from(wikiArticles).where(eq(wikiArticles.id, id)).limit(1);
      if (row!.status === "draft") await tx.update(wikiArticles).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(eq(wikiArticles.id, id));
    }
    for (const item of manifest.questions) {
      const id = phase.ids.questions[item.sourceKey]!;
      const [row] = await tx.select().from(questions).where(eq(questions.id, id)).limit(1);
      if (row!.status === "draft") await tx.update(questions).set({ status: "active", updatedAt: new Date() }).where(eq(questions.id, id));
    }
    for (const item of manifest.quizzes) {
      const id = phase.ids.quizzes[item.sourceKey]!;
      const [row] = await tx.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
      if (row!.status === "draft") await tx.update(quizzes).set({ status: "active", updatedAt: new Date() }).where(eq(quizzes.id, id));
    }
    for (const item of manifest.trails) {
      const id = phase.ids.trails[item.sourceKey]!;
      const [row] = await tx.select().from(trails).where(eq(trails.id, id)).limit(1);
      if (row!.status === "draft") await tx.update(trails).set({ status: "published", updatedAt: new Date() }).where(eq(trails.id, id));
    }
    const statuses = await refreshStatuses(tx, phase.ids);
    return { ...phase, statuses };
  });
}

async function quarantinePhase(
  manifest: NormalizedManifest,
  sha256: string,
  authorId: string,
): Promise<ImportPhaseResult> {
  return db.transaction(async (tx: DbTransaction): Promise<ImportPhaseResult> => {
    await lockBatch(tx, manifest.batchKey);
    await requireAuthor(tx, authorId);
    const phase = await importPhase(tx, manifest, sha256, authorId, false, true);
    assertCompletePhase(phase, "quarantine");
    for (const id of Object.values(phase.ids.articles)) await tx.update(wikiArticles).set({ status: "archived", updatedAt: new Date() }).where(eq(wikiArticles.id, id));
    for (const id of Object.values(phase.ids.questions)) await tx.update(questions).set({ status: "inactive", updatedAt: new Date() }).where(eq(questions.id, id));
    for (const id of Object.values(phase.ids.quizzes)) await tx.update(quizzes).set({ status: "inactive", updatedAt: new Date() }).where(eq(quizzes.id, id));
    for (const id of Object.values(phase.ids.trails)) await tx.update(trails).set({ status: "inactive", updatedAt: new Date() }).where(eq(trails.id, id));
    const statuses = await refreshStatuses(tx, phase.ids);
    return { ...phase, statuses };
  });
}

function envFlag(env: Readonly<Record<string, string | undefined>>, key: string): boolean {
  return env[key] === "1";
}

export type ImportFlags = {
  apply: boolean;
  publish: boolean;
  quarantine: boolean;
  enqueueEmbeddings: boolean;
};

/**
 * Validate phase flags before opening a database transaction. Keeping this
 * separate makes the publish safety invariant directly testable.
 */
export function validateImportFlags(
  env: Readonly<Record<string, string | undefined>>,
): ImportFlags {
  const flags = {
    apply: envFlag(env, "CONTENT_IMPORT_APPLY"),
    publish: envFlag(env, "CONTENT_IMPORT_PUBLISH"),
    quarantine: envFlag(env, "CONTENT_IMPORT_QUARANTINE"),
    enqueueEmbeddings: envFlag(env, "CONTENT_IMPORT_ENQUEUE_EMBEDDINGS"),
  };

  if (flags.apply && flags.publish) {
    throw new Error("CONTENT_IMPORT_APPLY=1 and CONTENT_IMPORT_PUBLISH=1 cannot be used together");
  }
  if (flags.quarantine && (flags.apply || flags.publish)) {
    throw new Error("CONTENT_IMPORT_QUARANTINE=1 must run as its own phase");
  }
  if (flags.publish && !flags.enqueueEmbeddings) {
    throw new Error("CONTENT_IMPORT_PUBLISH=1 requires CONTENT_IMPORT_ENQUEUE_EMBEDDINGS=1");
  }

  return flags;
}

async function loadManifest(): Promise<unknown> {
  // Keep this dynamic so importing the validator in a unit test does not execute the static manifest.
  const modulePath: string = "./rss-2026-08-content";
  return import(modulePath);
}

function expectedSha256(
  env: Readonly<Record<string, string | undefined>>,
  required: boolean,
): string | undefined {
  const configured = [
    env.CONTENT_IMPORT_EXPECTED_SHA256,
    env.CONTENT_IMPORT_EXPECTED_MANIFEST_SHA256,
    env.CONTENT_IMPORT_MANIFEST_SHA256,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim().toLowerCase());
  if (new Set(configured).size > 1) throw new Error("Manifest SHA-256 environment values disagree");
  const value = configured[0];
  if (!value) {
    if (required) throw new Error("CONTENT_IMPORT_EXPECTED_SHA256 is required for this phase");
    return undefined;
  }
  if (!/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error("CONTENT_IMPORT_EXPECTED_SHA256 must be a 64-character SHA-256 hex digest");
  }
  return value;
}

export type AffectedEmbeddingArticle = {
  articleId: number | null;
  sourceKey: string;
};

export class EmbeddingEnqueueError extends Error {
  readonly affectedArticles: AffectedEmbeddingArticle[];

  constructor(affectedArticles: AffectedEmbeddingArticle[], cause: unknown) {
    const affected = affectedArticles.length > 0
      ? affectedArticles.map(({ articleId, sourceKey }) => `${articleId ?? "unknown"} (${sourceKey})`).join(", ")
      : "unknown (no affected article was resolved)";
    super(
      `Embedding enqueue failed after the publish transaction committed. ` +
        `Affected imported article IDs/source keys: ${affected}. ` +
        `Re-run the publish phase to retry embedding enqueueing. Cause: ${safeError(cause)}`,
    );
    this.name = "EmbeddingEnqueueError";
    this.affectedArticles = affectedArticles;
  }
}

export async function enqueueEmbeddings(
  env: Readonly<Record<string, string | undefined>>,
  manifest: NormalizedManifest,
  phase: ImportPhaseResult,
): Promise<ImportReport["embeddingEnqueue"]> {
  if (!envFlag(env, "CONTENT_IMPORT_ENQUEUE_EMBEDDINGS")) {
    return { requested: false, status: "not-requested", count: 0 };
  }
  let count = 0;
  let queue: any;
  let closeStarted = false;
  try {
    // This is the same job and payload used by ArticleService's original
    // article publication path. It runs only after the publish transaction
    // has committed; it does not scrape or call an HTTP endpoint.
    ({ ragQueue: queue } = await import("../../lib/queue"));
    for (const article of manifest.articles) {
      const articleId = phase.ids.articles[article.sourceKey];
      if (articleId === undefined) throw new Error(`Article ${article.sourceKey} was not resolved`);
      await queue.add("generate-embeddings", {
        type: "generate-embeddings",
        articleId,
        content: article.contentText,
      });
      count++;
    }
    closeStarted = true;
    await queue.close();
    return { requested: true, status: "enqueued", count };
  } catch (error) {
    if (queue && !closeStarted) {
      try {
        await queue.close();
      } catch {
        // Preserve the original enqueue failure; the publish caller must see
        // a non-success result with the unresolved article identities.
      }
    }
    const affectedArticles = (closeStarted ? manifest.articles : manifest.articles.slice(count))
      .map((article) => ({
        articleId: phase.ids.articles[article.sourceKey] ?? null,
        sourceKey: article.sourceKey,
      }));
    throw new EmbeddingEnqueueError(affectedArticles, error);
  }
}

export async function runImport(
  env: Readonly<Record<string, string | undefined>> = process.env,
  manifestInput?: unknown,
): Promise<ImportReport> {
  const flags = validateImportFlags(env);
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const authorId = env.CONTENT_IMPORT_AUTHOR_ID?.trim();
  if (!authorId) throw new Error("CONTENT_IMPORT_AUTHOR_ID is required");
  const { apply, publish, quarantine } = flags;

  const manifest = validateManifest(manifestInput ?? await loadManifest());
  const sha256 = manifestSha256(manifest);
  const requiredPhaseSha = publish || quarantine;
  const expected = expectedSha256(env, requiredPhaseSha);
  if (expected && expected !== sha256) {
    throw new Error(`Expected manifest SHA-256 does not match the current manifest (${sha256})`);
  }
  if (publish) {
    const phase = await publishPhase(manifest, sha256, authorId);
    const embeddingEnqueue = await enqueueEmbeddings(env, manifest, phase);
    return {
      ...reportWithActualStates(phase, phase.statuses),
      status: "published",
      publicationRequested: true,
      quarantineRequested: false,
      embeddingEnqueue,
      warnings: embeddingEnqueue.warning ? [embeddingEnqueue.warning] : [],
    };
  }
  if (quarantine) {
    const phase = await quarantinePhase(manifest, sha256, authorId);
    return {
      ...reportWithActualStates(phase, phase.statuses),
      status: "quarantined",
      publicationRequested: false,
      quarantineRequested: true,
      embeddingEnqueue: { requested: false, status: "not-requested", count: 0 },
    };
  }
  const phase = await db.transaction((tx: DbTransaction) => importPhase(tx, manifest, sha256, authorId, apply, false));
  return {
    ...reportWithActualStates(phase, phase.statuses),
    status: apply ? "applied" : "dry-run",
    publicationRequested: false,
    quarantineRequested: false,
    embeddingEnqueue: {
      requested: flags.enqueueEmbeddings,
      status: "not-enqueued",
      count: 0,
      ...(flags.enqueueEmbeddings
        ? { warning: "Embedding jobs are enqueued only after a separate publish phase" }
        : {}),
    },
  };
}

function inspectFailure(
  value: unknown,
  seen: Set<object> = new Set(),
  depth = 0,
): string {
  if (depth > 6) return "[truncated]";
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value !== "object") return String(value);

  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (value instanceof Error) {
    const parts: string[] = [];
    const name = value.name || "Error";
    if (value.message) parts.push(`${name}: ${value.message}`);
    else parts.push(name);

    if ("cause" in value) {
      try {
        if (value.cause !== undefined) {
          parts.push(`cause=${inspectFailure(value.cause, seen, depth + 1)}`);
        }
      } catch {
        parts.push("cause=[unavailable]");
      }
    }
    if ("errors" in value) {
      try {
        const errors = value.errors;
        if (Array.isArray(errors)) {
          parts.push(
            `errors=[${errors.map((entry) => inspectFailure(entry, seen, depth + 1)).join("; ")}]`,
          );
        }
      } catch {
        parts.push("errors=[unavailable]");
      }
    }

    for (const key of Object.keys(value)) {
      if (key === "cause" || key === "errors") continue;
      try {
        parts.push(`${key}=${inspectFailure(value[key as keyof typeof value], seen, depth + 1)}`);
      } catch {
        parts.push(`${key}=[unavailable]`);
      }
    }
    return parts.join("; ");
  }

  const entries = Object.keys(value).map((key) => {
    try {
      return `${key}=${inspectFailure(value[key as keyof typeof value], seen, depth + 1)}`;
    } catch {
      return `${key}=[unavailable]`;
    }
  });
  return entries.length > 0 ? `{${entries.join(", ")}}` : "[object Object]";
}

export function safeError(error: unknown): string {
  return inspectFailure(error).replace(/(?:postgres(?:ql)?|postgres):\/\/[^\s"']+/gi, "[redacted]");
}

async function main(): Promise<void> {
  try {
    console.log(JSON.stringify(await runImport()));
    process.exit(0);
  } catch (error) {
    console.error(JSON.stringify({ batch: "rss-content-import", status: "failed", error: safeError(error) }));
    process.exit(1);
  }
}

if (import.meta.main) void main();
