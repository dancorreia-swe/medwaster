import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ForgotPasswordFormProps {
  onEmailSent?: (email: string) => void;
}

export function ForgotPasswordForm({ onEmailSent }: ForgotPasswordFormProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/reset-password`,
        });

        setSentEmail(value.email);
        setEmailSent(true);
        onEmailSent?.(value.email);

      } catch (error: any) {
        toast.error(
          error?.message || "Erro ao enviar email de redefinição"
        );
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Email inválido"),
      }),
    },
  });

  const handleResendEmail = async () => {
    if (sentEmail) {
      try {
        await authClient.requestPasswordReset({
          email: sentEmail,
          redirectTo: `${window.location.origin}/reset-password`,
        });

        toast.success("Email reenviado com sucesso!");
      } catch (error: any) {
        toast.error(error?.message || "Erro ao reenviar email");
      }
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-sm border border-border/80 bg-card/95 text-card-foreground shadow-md dark:border-border/60 dark:bg-card/80">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Check className="h-5 w-5 text-foreground" strokeWidth={2.5} />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-xl font-bold text-foreground">
              Verifique seu email!
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Enviamos um link mágico{"\n"}
              para você fazer login na sua conta.
            </p>
          </div>

          {/* Resend Button */}
          <div className="w-full pt-6">
            <Button
              onClick={handleResendEmail}
              className="h-10 w-full bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Reenviar Email
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border border-border/80 bg-card/95 text-card-foreground shadow-md dark:border-border/60 dark:bg-card/80">
      <CardContent className="flex flex-col gap-6">
        {/* Title and Description */}
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl font-bold text-foreground">
            Resete sua senha
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Digite seu endereço de e-mail e enviaremos um link para
            redefinir sua senha.
          </CardDescription>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <form.Field name="email">
            {(field) => (
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor={field.name}
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="Insira seu e-mail"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-10"
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
                className="h-11 w-full text-base font-semibold"
                disabled={!state.canSubmit || state.isSubmitting}
              >
                {state.isSubmitting
                  ? "Enviando..."
                  : "Enviar email de redefinição"}
              </Button>
            )}
          </form.Subscribe>
        </form>

        {/* Back to Login */}
        <Link
          to="/login"
          className="flex items-center gap-1 text-sm text-foreground hover:text-muted-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Login
        </Link>
      </CardContent>
    </Card>
  );
}
