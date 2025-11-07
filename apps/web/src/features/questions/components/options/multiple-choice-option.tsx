import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface MultipleChoiceOptionProps {
  option: { label: string; content: string; isCorrect: boolean };
  index: number;
  onUpdate: (field: "label" | "content" | "isCorrect", value: any) => void;
  onRemove: () => void;
  onToggleCorrect: () => void;
  isRemoving: boolean;
  canRemove?: boolean;
}

export function MultipleChoiceOption({
  option,
  index,
  onUpdate,
  onRemove,
  onToggleCorrect,
  isRemoving,
  canRemove = true,
}: MultipleChoiceOptionProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 transition-all duration-200 ${
        isRemoving
          ? "opacity-0 scale-95 -translate-x-2"
          : "opacity-100 scale-100 translate-x-0 animate-in fade-in slide-in-from-left-2"
      }`}
    >
      <div className="flex items-center pt-2">
        <Checkbox checked={option.isCorrect} onCheckedChange={onToggleCorrect} />
      </div>

      <div className="flex-1 space-y-2">
        <Input
          placeholder="Rótulo (ex: A, B, C)"
          value={option.label}
          onChange={(e) => onUpdate("label", e.target.value)}
          className="max-w-[120px]"
        />
        <Input
          placeholder="Conteúdo da opção"
          value={option.content}
          onChange={(e) => onUpdate("content", e.target.value)}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={isRemoving || !canRemove}
        className="hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
