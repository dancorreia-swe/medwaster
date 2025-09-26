import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "../../../components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input, PasswordInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignInForm({}: { onSwitchToSignUp?: () => void }) {
  const navigate = useNavigate({
    from: "/login",
  });

  const search = useSearch({
    from: "/login",
  });

  const { data: session, isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: () => {
            const redirectTo = search.redirect || "/dashboard";

            navigate({
              to: redirectTo,
              replace: true,
            });
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("E-mail inválido"),
        password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <Card className="w-full max-w-md border-slate-200 bg-white/95 shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-slate-900">
          Bem-vindo de volta
        </CardTitle>
        <CardDescription>
          Entre para acessar o painel do MedWaster.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();

            form.handleSubmit();
          }}
          className="flex flex-col gap-5"
        >
          <form.Field name="email">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-sm font-medium text-slate-900"
                >
                  E-mail
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-sm font-medium text-slate-900"
                >
                  Senha
                </Label>
                <PasswordInput
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  autoComplete="current-password"
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>

          <div className="flex items-center justify-start">
            <Button
              type="button"
              variant="link"
              onClick={() =>
                toast.info("A recuperação de senha estará disponível em breve.")
              }
              className="px-0 text-sm font-medium"
            >
              Esqueceu sua senha?
            </Button>
          </div>

          <form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                className="h-11 w-full text-base font-semibold"
                disabled={!state.canSubmit || state.isSubmitting}
              >
                {state.isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
