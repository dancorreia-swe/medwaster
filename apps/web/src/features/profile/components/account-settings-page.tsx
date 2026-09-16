import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { profileApi, profileQueryKeys } from "../api";
import {
  normalizeEmail,
  validateCurrentPassword,
  validateNewEmail,
  validateVerificationToken,
} from "../lib/validation";

type EmailChangeStep = "request" | "verify";

interface RequestErrors {
  newEmail?: string;
  password?: string;
}

export function AccountSettingsPage() {
  const { data: session, isPending: isSessionPending, refetch } =
    authClient.useSession();
  const queryClient = useQueryClient();

  const user = session?.user;

  const [step, setStep] = useState<EmailChangeStep>("request");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");
  const [requestErrors, setRequestErrors] = useState<RequestErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const resetFlow = () => {
    setStep("request");
    setNewEmail("");
    setPassword("");
    setShowPassword(false);
    setToken("");
    setRequestErrors({});
    setRequestError(null);
    setTokenError(null);
    setPendingEmail(null);
  };

  const requestMutation = useMutation({
    mutationFn: (input: { newEmail: string; password: string }) =>
      profileApi.requestEmailChange(input),
    onSuccess: (_data, input) => {
      setRequestError(null);
      setPendingEmail(input.newEmail);
      setPassword("");
      setShowPassword(false);
      setStep("verify");
      toast.success("Código enviado para o novo email");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível solicitar a alteração de email.";
      setRequestError(message);
      toast.error(message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (input: { token: string }) =>
      profileApi.verifyEmailChange(input),
    onSuccess: async () => {
      toast.success("Email alterado com sucesso");
      resetFlow();
      await refetch({ query: { disableCookieCache: true } });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar a alteração de email.";
      setTokenError(message);
    },
  });

  const handleRequestSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const errors: RequestErrors = {};
    const emailError = validateNewEmail(newEmail, user?.email);
    if (emailError) errors.newEmail = emailError;

    const passwordError = validateCurrentPassword(password);
    if (passwordError) errors.password = passwordError;

    setRequestErrors(errors);
    setRequestError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    requestMutation.mutate({
      newEmail: normalizeEmail(newEmail),
      password,
    });
  };

  const handleVerifySubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateVerificationToken(token);
    if (validationError) {
      setTokenError(validationError);
      return;
    }

    setTokenError(null);
    verifyMutation.mutate({ token: token.trim() });
  };

  const isRequesting = requestMutation.isPending;
  const isVerifying = verifyMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">Configurações</h1>
        <p className="text-sm text-muted-foreground md:max-w-2xl">
          Ajustes da sua conta de administrador. Preferências gerais da
          plataforma continuam em outras áreas do painel.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conta</CardTitle>
          <CardDescription>
            Endereço de email usado para login, recuperação de senha e
            notificações.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Email atual</span>
            {isSessionPending ? (
              <Skeleton className="h-9 w-full max-w-sm" />
            ) : (
              <div className="flex max-w-sm items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                <Mail
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-medium">
                  {user?.email ?? "Indisponível"}
                </span>
              </div>
            )}
          </div>

          <Separator />

          {step === "request" ? (
            <form
              className="flex flex-col gap-4"
              onSubmit={handleRequestSubmit}
              noValidate
            >
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">Alterar email</h2>
                <p className="text-xs text-muted-foreground">
                  Enviaremos um código de confirmação para o novo endereço. O
                  email só muda depois que você confirmar esse código.
                </p>
              </div>

              {requestError ? (
                <Alert variant="destructive" className="md:max-w-xl">
                  <AlertTitle>Não foi possível enviar o código</AlertTitle>
                  <AlertDescription>{requestError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4 md:max-w-xl md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-email">Novo email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    autoComplete="email"
                    disabled={isRequesting}
                    aria-invalid={requestErrors.newEmail ? true : undefined}
                    aria-describedby={
                      requestErrors.newEmail ? "new-email-error" : undefined
                    }
                    onChange={(event) => {
                      setNewEmail(event.target.value);
                      if (requestErrors.newEmail) {
                        setRequestErrors((current) => ({
                          ...current,
                          newEmail: undefined,
                        }));
                      }
                    }}
                  />
                  {requestErrors.newEmail ? (
                    <p
                      id="new-email-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {requestErrors.newEmail}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="current-password-email">Senha atual</Label>
                  <div className="relative">
                    <Input
                      id="current-password-email"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      autoComplete="current-password"
                      disabled={isRequesting}
                      className="pr-10"
                      aria-invalid={requestErrors.password ? true : undefined}
                      aria-describedby={
                        requestErrors.password
                          ? "current-password-email-error"
                          : undefined
                      }
                      onChange={(event) => {
                        setPassword(event.target.value);
                        if (requestErrors.password) {
                          setRequestErrors((current) => ({
                            ...current,
                            password: undefined,
                          }));
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={isRequesting}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="size-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  </div>
                  {requestErrors.password ? (
                    <p
                      id="current-password-email-error"
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {requestErrors.password}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <Button type="submit" disabled={isRequesting}>
                  {isRequesting ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Enviando código
                    </>
                  ) : (
                    "Enviar código"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={handleVerifySubmit}
              noValidate
            >
              <Alert>
                <CheckCircle2 aria-hidden="true" />
                <AlertTitle>Confirme o novo endereço</AlertTitle>
                <AlertDescription>
                  Enviamos um código para <strong>{pendingEmail}</strong>. Ele
                  vale por 1 hora. Seu email atual continua ativo até a
                  confirmação.
                </AlertDescription>
              </Alert>

              <div className="flex max-w-sm flex-col gap-2">
                <Label htmlFor="email-change-token">Código de confirmação</Label>
                <Input
                  id="email-change-token"
                  value={token}
                  autoComplete="one-time-code"
                  disabled={isVerifying}
                  aria-invalid={tokenError ? true : undefined}
                  aria-describedby={
                    tokenError ? "email-change-token-error" : undefined
                  }
                  onChange={(event) => {
                    setToken(event.target.value);
                    if (tokenError) setTokenError(null);
                  }}
                />
                {tokenError ? (
                  <p
                    id="email-change-token-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {tokenError}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isVerifying}>
                  {isVerifying ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Confirmando
                    </>
                  ) : (
                    "Confirmar alteração"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFlow}
                  disabled={isVerifying}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Usar outro endereço
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Senha e dados pessoais</CardTitle>
          <CardDescription>
            A troca de senha e o nome de exibição ficam no seu perfil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck
                className="size-4 shrink-0"
                aria-hidden="true"
              />
              Gerencie sua senha e seu nome em Meu perfil.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/profile">Ir para Meu perfil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
