import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Info, X } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface BlankOption {
  text: string;
  isCorrect: boolean;
}

interface Blank {
  sequence: number;
  placeholder: string;
  answer?: string;
  options: BlankOption[];
}

interface QuestionFillBlanksEditorProps {
  blanks: Blank[];
  onChange: (blanks: Blank[]) => void;
}

export function QuestionFillBlanksEditor({
  blanks,
  onChange,
}: QuestionFillBlanksEditorProps) {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);

  const addBlank = () => {
    onChange([
      ...blanks,
      {
        sequence: blanks.length + 1,
        placeholder: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ] 
      },
    ]);
  };

  const removeBlank = (index: number) => {
    setRemovingIndex(index);
    setTimeout(() => {
      const updated = blanks
        .filter((_, i) => i !== index)
        .map((blank, i) => ({ ...blank, sequence: i + 1 }));
      onChange(updated);
      setRemovingIndex(null);
    }, 200);
  };

  const updateBlank = (
    index: number,
    field: keyof Blank,
    value: any,
  ) => {
    const updated = [...blanks];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addOption = (blankIndex: number) => {
    const updated = [...blanks];
    const blank = updated[blankIndex];
    
    updated[blankIndex] = {
      ...blank,
      options: [...blank.options, { text: "", isCorrect: false }],
    };
    onChange(updated);
  };

  const updateOption = (
    blankIndex: number,
    optionIndex: number,
    field: keyof BlankOption,
    value: any,
  ) => {
    const updated = [...blanks];
    const blank = updated[blankIndex];
    const options = [...blank.options];
    
    options[optionIndex] = { ...options[optionIndex], [field]: value };
    
    // If setting this option as correct, unset all others
    if (field === "isCorrect" && value === true) {
      options.forEach((opt, i) => {
        if (i !== optionIndex) opt.isCorrect = false;
      });
    }
    
    updated[blankIndex] = { ...blank, options };
    onChange(updated);
  };

  const removeOption = (blankIndex: number, optionIndex: number) => {
    const updated = [...blanks];
    const blank = updated[blankIndex];
    const options = blank.options.filter((_, i) => i !== optionIndex);
    
    updated[blankIndex] = { ...blank, options };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No enunciado acima, use placeholders para marcar onde as lacunas devem
          aparecer:{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">
            {"{{1}}"}
          </code>{" "}
          <code className="bg-muted px-1 py-0.5 rounded text-xs">
            {"{{2}}"}
          </code>
          <span className="text-xs text-muted-foreground mt-1 block">
            Exemplo: "O coração humano possui{" "}
            <code className="bg-muted px-1 py-0.5 rounded">{"{{1}}"}</code>{" "}
            câmaras chamadas{" "}
            <code className="bg-muted px-1 py-0.5 rounded">{"{{2}}"}</code>."
          </span>
          <span className="text-xs text-muted-foreground mt-2 block font-medium">
            Cada lacuna deve ter pelo menos 2 opções de múltipla escolha.
          </span>
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <Label>Definir Respostas das Lacunas</Label>
        <Button type="button" variant="outline" size="sm" onClick={addBlank}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Lacuna
        </Button>
      </div>

      {blanks.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma lacuna adicionada. Clique em "Adicionar Lacuna" para começar.
        </p>
      )}

      <div className="space-y-3">
        {blanks.map((blank, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 rounded-lg border p-4 transition-all duration-200 ${
              removingIndex === index
                ? "opacity-0 scale-95 -translate-x-2"
                : "opacity-100 scale-100 translate-x-0 animate-in fade-in slide-in-from-left-2"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
              {blank.sequence}
            </div>

            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Lacuna {"{{" + blank.sequence + "}}"}
                </Label>
                <Input
                  placeholder="Placeholder (opcional, ex: nome do órgão)"
                  value={blank.placeholder}
                  onChange={(e) =>
                    updateBlank(index, "placeholder", e.target.value)
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Opções de Múltipla Escolha * (mínimo 2)
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addOption(index)}
                    className="h-7 text-xs"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Adicionar Opção
                  </Button>
                </div>

                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  {blank.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className="flex items-center gap-2"
                    >
                      <Badge
                        variant={option.isCorrect ? "default" : "outline"}
                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs shrink-0 cursor-pointer"
                        onClick={() =>
                          updateOption(index, optIndex, "isCorrect", !option.isCorrect)
                        }
                      >
                        {String.fromCharCode(65 + optIndex)}
                      </Badge>
                      <Input
                        placeholder="Digite a opção"
                        value={option.text}
                        onChange={(e) =>
                          updateOption(index, optIndex, "text", e.target.value)
                        }
                        className="text-sm h-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index, optIndex)}
                        disabled={blank.options.length <= 2}
                        className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    Clique na letra para marcar como correta
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeBlank(index)}
              disabled={removingIndex !== null}
              className="hover:bg-destructive/10 hover:text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
