import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/features/questions/components/image-upload";
import type { QuizFormData } from "../types";

interface QuizCoverProps {
  formData: QuizFormData;
  onChange: (data: Partial<QuizFormData>) => void;
}

/**
 * The quiz's cover: the title, blurb, instructions and image the learner reads
 * on the intro screen before starting. These belong at the top of the document
 * rather than in the settings panel, because they are content, not rules.
 */
export function QuizCover({ formData, onChange }: QuizCoverProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="title" className="sr-only">
          Título do quiz
        </label>
        <input
          id="title"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Título do quiz"
          className="w-full border-0 bg-transparent p-0 text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40 focus-visible:ring-0"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs text-muted-foreground">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Resumo que o aluno lê antes de iniciar"
            className="resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="instructions"
            className="text-xs text-muted-foreground"
          >
            Instruções
          </Label>
          <Textarea
            id="instructions"
            value={formData.instructions}
            onChange={(e) => onChange({ instructions: e.target.value })}
            placeholder="Como responder, o que é permitido consultar"
            className="resize-none"
            rows={3}
          />
        </div>
      </div>

      <ImageUpload
        className="max-w-sm"
        label="Imagem de capa"
        description="Opcional. Aparece na tela de abertura do quiz."
        value={formData.imageUrl}
        keyValue={formData.imageKey}
        uploadPath="/api/admin/quizzes/images/upload"
        deletePath="/api/admin/quizzes/images"
        onChange={(data) =>
          onChange({
            imageUrl: data?.url || undefined,
            imageKey: data?.key || undefined,
          })
        }
      />
    </div>
  );
}
