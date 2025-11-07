import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrueFalseSelectorProps {
  options: Array<{ label: string; content: string; isCorrect: boolean }>;
  onChange: (
    options: Array<{ label: string; content: string; isCorrect: boolean }>,
  ) => void;
}

export function TrueFalseSelector({
  options,
  onChange,
}: TrueFalseSelectorProps) {
  const selectedAnswer = (() => {
    if (options.length !== 2) return null;
  
    const trueOption = options.find(opt => opt.label === "Verdadeiro");
    const falseOption = options.find(opt => opt.label === "Falso");

    if (trueOption?.isCorrect) return "true";
    if (falseOption?.isCorrect) return "false";

    return null;
  })();

  const selectTrueFalse = (isTrue: boolean) => {
    onChange([
      { label: "Verdadeiro", content: "Verdadeiro", isCorrect: isTrue },
      { label: "Falso", content: "Falso", isCorrect: !isTrue },
    ]);
  };

  return (
    <div className="space-y-4">
      <Label>Selecione a Resposta Correta</Label>
      <div className="grid grid-cols-2 gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => selectTrueFalse(true)}
          className={cn(
            "h-32 flex-col gap-2 text-2xl transition-all hover:bg-green-50/50",
            selectedAnswer === "true" &&
              "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
          )}
        >
          <Check className="h-12 w-12" />
          <span>Verdadeiro</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => selectTrueFalse(false)}
          className={cn(
            "h-32 flex-col gap-2 text-2xl transition-all hover:bg-red-50/50",
            selectedAnswer === "false" &&
              "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
          )}
        >
          <X className="h-12 w-12" />
          <span>Falso</span>
        </Button>
      </div>
    </div>
  );
}
