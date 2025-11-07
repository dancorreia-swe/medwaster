import { ArrowRightLeft, LayoutList, ListTodo } from "lucide-react";
import { TrueFalseIcon } from "@/components/ui/true-false-icon";
import type { QuestionType, QuestionDifficulty, QuestionStatus } from "./types";

export const QUESTION_TYPE_OPTIONS = [
  { value: "multiple_choice" as const, label: "Múltipla Escolha", icon: ListTodo },
  { value: "true_false" as const, label: "Verdadeiro/Falso", icon: TrueFalseIcon },
  { value: "fill_in_the_blank" as const, label: "Preencher Lacunas", icon: LayoutList },
  { value: "matching" as const, label: "Correspondência", icon: ArrowRightLeft },
];

export const DIFFICULTY_LEVEL_OPTIONS = [
  { value: "basic" as const, label: "Básico" },
  { value: "intermediate" as const, label: "Intermediário" },
  { value: "advanced" as const, label: "Avançado" },
];

export const STATUS_OPTIONS = [
  { value: "draft" as const, label: "Rascunho" },
  { value: "active" as const, label: "Ativo" },
  { value: "inactive" as const, label: "Inativo" },
];

export const DEFAULT_MULTIPLE_CHOICE_OPTIONS = [
  { label: "A", content: "", isCorrect: false },
  { label: "B", content: "", isCorrect: false },
  { label: "C", content: "", isCorrect: false },
  { label: "D", content: "", isCorrect: false },
  { label: "E", content: "", isCorrect: false },
];

export const DEFAULT_MATCHING_PAIRS = [
  { leftText: "", rightText: "", sequence: 1 },
  { leftText: "", rightText: "", sequence: 2 },
  { leftText: "", rightText: "", sequence: 3 },
  { leftText: "", rightText: "", sequence: 4 },
];

export const VALIDATION_MESSAGES = {
  PROMPT_REQUIRED: "O enunciado é obrigatório",
  AUTH_REQUIRED: "Você precisa estar autenticado para criar uma questão",
  MULTIPLE_CHOICE_NO_CORRECT: "Selecione pelo menos uma opção correta",
  MULTIPLE_CHOICE_INCOMPLETE: "Preencha todas as opções de múltipla escolha",
  TRUE_FALSE_NO_CORRECT: "Selecione a resposta correta (Verdadeiro ou Falso)",
  FILL_BLANK_REQUIRED: "Adicione pelo menos uma lacuna",
  FILL_BLANK_NO_CORRECT: (index: number) => `Lacuna ${index + 1}: selecione a opção correta`,
  FILL_BLANK_INCOMPLETE: (index: number) => `Lacuna ${index + 1}: preencha todas as opções`,
  FILL_BLANK_NO_ANSWER: (index: number) => `Lacuna ${index + 1}: preencha a resposta correta`,
  MATCHING_REQUIRED: "Adicione pelo menos um par de correspondência",
  MATCHING_LEFT_EMPTY: (index: number) => `Par ${index + 1}: preencha o texto da esquerda`,
  MATCHING_RIGHT_EMPTY: (index: number) => `Par ${index + 1}: preencha o texto da direita`,
  CREATE_ERROR: "Erro ao criar questão. Tente novamente.",
};
