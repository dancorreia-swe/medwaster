import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState } from "react";
import { MultipleChoiceOption } from "./multiple-choice-option";

interface MultipleChoiceEditorProps {
  options: Array<{ label: string; content: string; isCorrect: boolean }>;
  onChange: (
    options: Array<{ label: string; content: string; isCorrect: boolean }>,
  ) => void;
  maxOptions?: number;
  minOptions?: number;
}

export function MultipleChoiceEditor({
  options,
  onChange,
  maxOptions = 5,
  minOptions = 4,
}: MultipleChoiceEditorProps) {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const addOption = () => {
    if (options.length >= maxOptions) return;

    const newLabel = String.fromCharCode(65 + options.length);
    onChange([...options, { label: newLabel, content: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= minOptions) return;
    
    setRemovingIndex(index);
    setTimeout(() => {
      onChange(options.filter((_, i) => i !== index));
      setRemovingIndex(null);
    }, 200);
  };

  const updateOption = (
    index: number,
    field: "label" | "content" | "isCorrect",
    value: any,
  ) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };

    onChange(updated);
  };

  const toggleCorrect = (index: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Opções de Resposta (mín. {minOptions}, máx. {maxOptions})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addOption}
          disabled={options.length >= maxOptions}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Opção
        </Button>
      </div>

      {options.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma opção adicionada. Clique em "Adicionar Opção" para começar.
        </p>
      )}

      <div className="space-y-3">
        {options.map((option, index) => (
          <MultipleChoiceOption
            key={index}
            option={option}
            index={index}
            onUpdate={(field, value) => updateOption(index, field, value)}
            onRemove={() => removeOption(index)}
            onToggleCorrect={() => toggleCorrect(index)}
            isRemoving={removingIndex === index}
            canRemove={options.length > minOptions}
          />
        ))}
      </div>
    </div>
  );
}
