import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { useState } from "react";

interface QuestionMatchingEditorProps {
  pairs: Array<{ leftText: string; rightText: string; sequence: number }>;
  onChange: (pairs: Array<{ leftText: string; rightText: string; sequence: number }>) => void;
}

const MAX_PAIRS = 4;

export function QuestionMatchingEditor({ pairs, onChange }: QuestionMatchingEditorProps) {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const addPair = () => {
    if (pairs.length >= MAX_PAIRS) return;
    
    onChange([
      ...pairs,
      { leftText: "", rightText: "", sequence: pairs.length + 1 },
    ]);
  };

  const removePair = (index: number) => {
    setRemovingIndex(index);
    setTimeout(() => {
      const updated = pairs
        .filter((_, i) => i !== index)
        .map((pair, i) => ({ ...pair, sequence: i + 1 }));
      onChange(updated);
      setRemovingIndex(null);
    }, 200);
  };

  const updatePair = (index: number, field: keyof typeof pairs[0], value: any) => {
    const updated = [...pairs];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Pares para Correspondência ({pairs.length}/{MAX_PAIRS})</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPair}
          disabled={pairs.length >= MAX_PAIRS}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Par
        </Button>
      </div>

      {pairs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum par adicionado. Clique em "Adicionar Par" para começar.
        </p>
      )}

      <div className="space-y-3">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg border p-4 transition-all duration-200 ${
              removingIndex === index
                ? "opacity-0 scale-95 -translate-x-2"
                : "opacity-100 scale-100 translate-x-0 animate-in fade-in slide-in-from-left-2"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {pair.sequence}
            </div>
            
            <div className="flex flex-1 items-center gap-3">
              <Input
                placeholder="Texto da esquerda"
                value={pair.leftText}
                onChange={(e) => updatePair(index, "leftText", e.target.value)}
                className="flex-1"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Texto da direita"
                value={pair.rightText}
                onChange={(e) => updatePair(index, "rightText", e.target.value)}
                className="flex-1"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removePair(index)}
              disabled={pairs.length === 1 || removingIndex !== null}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
