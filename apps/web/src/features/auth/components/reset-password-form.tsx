import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const search = useSearch({ 
    from: "/reset-password"
  }) as { token?: string };

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      if (!search.token) {
        toast.error("Token de redefinição não encontrado");
        return;
      }

      if (value.newPassword !== value.confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }

      try {
        await authClient.resetPassword({
          newPassword: value.newPassword,
          token: search.token,
        });

        toast.success("Senha redefinida com sucesso!");
        navigate({ to: "/login", replace: true });
      } catch (error: any) {
        toast.error(
          error?.message || "Erro ao redefinir senha. Tente novamente."
        );
      }
    },
    validators: {
      onSubmit: z.object({
        newPassword: z
          .string()
          .min(8, "A senha deve ter pelo menos 8 caracteres")
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número"
          ),
        confirmPassword: z.string().min(1, "Confirme sua senha"),
      }),
    },
  });

  if (!search.token) {
    return (
      <Card className="w-full max-w-sm border-slate-200 bg-white shadow-md">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Token Inválido
            </h2>
            <p className="text-sm text-slate-500">
              O link de redefinição de senha é inválido ou expirou.
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/forgot-password", replace: true })}
            className="w-full"
          >
            Solicitar Novo Link
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border-slate-200 bg-white shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">
          Crie uma nova senha
        </CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Sua nova senha deve ser diferente da anterior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="newPassword">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-sm font-medium text-slate-900"
                >
                  Nova Senha
                </Label>
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-10 border-slate-200 bg-white"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="confirmPassword">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-sm font-medium text-slate-900"
                >
                  Confirmar Senha
                </Label>
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-10 border-slate-200 bg-white"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                className="h-10 w-full bg-[#155DFC] text-sm font-medium text-white hover:bg-[#155DFC]/90"
                disabled={!state.canSubmit || state.isSubmitting}
              >
                {state.isSubmitting ? "Redefinindo..." : "Redefinir Senha"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}