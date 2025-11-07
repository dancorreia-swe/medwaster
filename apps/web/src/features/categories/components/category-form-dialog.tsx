import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRef, useEffect } from "react";
import Color from "color";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerPreview,
  ColorPickerEyeDropper,
} from "@/components/ui/shadcn-io/color-picker";
import { randomColor } from "@/lib/utils";

interface Category {
  id?: number | string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

const categoryFormSchema = z.object({
  name: z
    .string()
    .min(1, "O nome é obrigatório")
    .max(100, "O nome pode ter no máximo 100 caracteres"),
  slug: z
    .string()
    .min(1, "O slug é obrigatório")
    .max(100, "O slug pode ter no máximo 100 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "O slug deve conter apenas letras minúsculas, números e hífens",
    ),
  description: z
    .string()
    .max(500, "A descrição pode ter no máximo 500 caracteres"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  isSubmitting = false,
}: CategoryFormDialogProps) {
  const isEditing = !!category;
  const lastColorRef = useRef<string>("");

  const defaultRandomColor = randomColor();

  const form = useForm({
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      color: category?.color ?? defaultRandomColor,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      form.reset();
    },
    validators: {
      onSubmit: categoryFormSchema,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    } else if (category) {
      form.setFieldValue("name", category.name);
      form.setFieldValue("slug", category.slug);
      form.setFieldValue("description", category.description ?? "");
      form.setFieldValue("color", category.color ?? defaultRandomColor);

      lastColorRef.current = category.color ?? defaultRandomColor;
    } else {
      form.reset();
    }
  }, [open, category, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações da categoria."
              : "Preencha as informações para criar uma nova categoria."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  Nome<span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const value = e.target.value;
                    field.handleChange(value);

                    if (!isEditing && value) {
                      form.setFieldValue("slug", slugify(value));
                    }
                  }}
                  placeholder="Digite o nome da categoria"
                  disabled={isSubmitting}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="slug">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="slug-da-categoria"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  {isEditing
                    ? "Identificador único da categoria na URL"
                    : "Gerado automaticamente a partir do nome"}
                </p>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  Descrição
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Descrição opcional da categoria"
                  disabled={isSubmitting}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
                <p className="text-xs text-muted-foreground">
                  Escreva uma breve descrição para a categoria (opcional)
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="color">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-sm font-medium">
                  Cor
                </Label>
                <ColorPicker
                  defaultValue={field.state.value}
                  onChange={(rgba) => {
                    if (Array.isArray(rgba)) {
                      const color = Color.rgb(rgba[0], rgba[1], rgba[2]);
                      const hex = color.hex();

                      if (hex !== lastColorRef.current) {
                        lastColorRef.current = hex;
                        field.handleChange(hex);
                      }
                    }
                  }}
                  className="w-full"
                >
                  <div className="space-y-3">
                    <ColorPickerSelection className="h-32 w-full rounded-md" />
                    <ColorPickerHue className="w-full" />

                    <div className="flex items-center gap-2">
                      <ColorPickerEyeDropper />
                      <ColorPickerPreview
                        label="Cor selecionada"
                        showLabel={false}
                        className="w-full"
                      />
                    </div>
                  </div>
                </ColorPicker>
                <p className="text-xs text-muted-foreground">
                  Escolha uma cor para identificar visualmente a categoria
                </p>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isFormSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isFormSubmitting}
                >
                  {isSubmitting || isFormSubmitting ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {isEditing ? "Salvando..." : "Criando..."}
                    </>
                  ) : (
                    <>{isEditing ? "Salvar" : "Criar Categoria"}</>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}