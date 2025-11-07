import { QuestionCard } from "./question-card";
import type { QuestionListItem } from "../types";
import { useNavigate } from "@tanstack/react-router";

export function QuestionsGrid({ questions }: { questions: QuestionListItem[] }) {
  const navigate = useNavigate();

  const handleQuestionClick = (questionId: number) => {
    navigate({ to: "/questions/$questionId", params: { questionId: questionId.toString() } });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {questions.map((question) => (
        <div
          key={question.id}
          onClick={() => handleQuestionClick(question.id)}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
        >
          <QuestionCard question={question} />
        </div>
      ))}
    </div>
  );
}
