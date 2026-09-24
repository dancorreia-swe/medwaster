import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  Clock,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  MailCheck,
  MailX,
  Pencil,
  RefreshCw,
  Shield,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { authClient } from "@/lib/auth-client";
import { getRoleDisplayName } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { accountStatsQueryOptions, profileApi, profileQueryKeys } from "../api";
import {
  NAME_MAX_LENGTH,
  normalizeName,
  validateDisplayName,
} from "../lib/validation";

function getInitials(name: string | null | undefined) {
  if (!name) return "?";

  return name
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfilePage() {
  const { data: session, isPending: isSessionPending, refetch } =
    authClient.useSession();
  const queryClient = useQueryClient();

  const user = session?.user;

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const accountQuery = useQuery({
    ...accountStatsQueryOptions(),
    enabled: Boolean(user),
  });

  const account = accountQuery.data;

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(user?.name ?? "");
    }
  }, [user?.name, isEditingName]);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => profileApi.updateProfile({ name }),
    onSuccess: async () => {
      toast.success("Nome atualizado com sucesso");
      setIsEditingName(false);
      setNameError(null);
      await refetch({ query: { disableCookieCache: true } });
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.";
      setNameError(message);
      toast.error(message);
    },
  });

  if (isSessionPending) {
    return <ProfileSkeleton />;
  }

  if (!user) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Sessão não encontrada</AlertTitle>
        <AlertDescription>
          Não foi possível carregar seu perfil. Entre novamente para continuar.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmitName = (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateDisplayName(nameDraft);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    const normalized = normalizeName(nameDraft);

    if (normalized === (user.name ?? "")) {
      setIsEditingName(false);
      setNameError(null);
      return;
    }

    setNameError(null);
    updateNameMutation.mutate(normalized);
  };

  const handleCancelName = () => {
    setNameDraft(user.name ?? "");
    setNameError(null);
    setIsEditingName(false);
  };

  const isSaving = updateNameMutation.isPending;
  const hasPassword = account?.hasPassword ?? null;
  const connectedAccounts = account?.connectedAccounts ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">Meu perfil</h1>
        <p className="text-sm text-muted-foreground md:max-w-2xl">
          Revise seus dados pessoais e o status de segurança da sua conta de
          administrador.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-16">
              <AvatarImage src={user.image || ""} alt="" />
              <AvatarFallback className="bg-accent text-accent-foreground text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-2">
              <CardTitle className="truncate text-xl">{user.name}</CardTitle>
              <CardDescription className="flex min-w-0 items-center gap-2">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </CardDescription>
              <div className="flex flex-wrap items-center gap-2">
                {user.role ? (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="size-3" aria-hidden="true" />
                    {getRoleDisplayName(user.role)}
                  </Badge>
                ) : null}
                {user.emailVerified ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-success text-success"
                  >
                    <MailCheck className="size-3" aria-hidden="true" />
                    Email verificado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <MailX className="size-3" aria-hidden="true" />
                    Email não verificado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent>
          <h2 className="text-base font-semibold">Informações pessoais</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {isEditingName ? (
              <form
                className="flex flex-col gap-2"
                onSubmit={handleSubmitName}
                noValidate
              >
                <Label htmlFor="profile-name">Nome de exibição</Label>
                <Input
                  id="profile-name"
                  value={nameDraft}
                  maxLength={NAME_MAX_LENGTH}
                  autoComplete="name"
                  disabled={isSaving}
                  aria-invalid={nameError ? true : undefined}
                  aria-describedby={
                    nameError ? "profile-name-error" : "profile-name-hint"
                  }
                  onChange={(event) => {
                    setNameDraft(event.target.value);
                    if (nameError) setNameError(null);
                  }}
                />
                {nameError ? (
                  <p
                    id="profile-name-error"
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {nameError}
                  </p>
                ) : (
                  <p
                    id="profile-name-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Este nome aparece no painel e nos registros de auditoria.
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2">
                  <Button type="submit" size="sm" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                        Salvando
                      </>
                    ) : (
                      "Salvar nome"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCancelName}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Nome de exibição</span>
                <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/40 px-3 py-2">
                  <span className="truncate text-sm font-medium">
                    {user.name}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    Editar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este nome aparece no painel e nos registros de auditoria.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Email</span>
              <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
                <span className="truncate text-sm font-medium">
                  {user.email}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                A alteração de email exige confirmação por código.{" "}
                <Link
                  to="/admin/settings"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Alterar em Configurações
                </Link>
                .
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Segurança</CardTitle>
            <CardDescription>
              Credenciais e formas de acesso a esta conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <KeyRound className="size-4" aria-hidden="true" />
                  Senha
                </p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  {accountQuery.isLoading
                    ? "Verificando as formas de acesso da conta."
                    : hasPassword === false
                      ? "Esta conta entra por provedor externo e não possui senha definida."
                      : "Altere sua senha periodicamente. As outras sessões são encerradas após a troca."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangePasswordOpen(true)}
                disabled={accountQuery.isLoading || hasPassword === false}
              >
                Alterar senha
              </Button>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Mail className="size-4" aria-hidden="true" />
                Email de acesso
              </p>
              <p className="max-w-sm text-xs text-muted-foreground">
                {user.emailVerified
                  ? "Endereço verificado. Ele é usado para login e notificações."
                  : "Endereço ainda não verificado. Confirme para proteger a recuperação de conta."}
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Link2 className="size-4" aria-hidden="true" />
                Contas conectadas
              </p>
              {accountQuery.isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : connectedAccounts.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {connectedAccounts.map((connected) => (
                    <li key={`${connected.provider}-${connected.accountId}`}>
                      <Badge variant="secondary">{connected.provider}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum provedor externo conectado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detalhes da conta</CardTitle>
            <CardDescription>
              Informações registradas pelo sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accountQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : accountQuery.isError ? (
              <Alert variant="destructive">
                <AlertTitle>Erro ao carregar os dados da conta</AlertTitle>
                <AlertDescription className="flex flex-col items-start gap-3">
                  <span>
                    {accountQuery.error instanceof Error
                      ? accountQuery.error.message
                      : "Tente novamente em alguns instantes."}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => accountQuery.refetch()}
                    disabled={accountQuery.isFetching}
                  >
                    <RefreshCw
                      className={`size-4 ${accountQuery.isFetching ? "animate-spin" : ""}`}
                      aria-hidden="true"
                    />
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <AccountDetail
                  icon={
                    <CalendarDays className="size-4" aria-hidden="true" />
                  }
                  label="Conta criada em"
                  value={formatDate(account?.accountCreatedAt)}
                />
                <AccountDetail
                  icon={<Clock className="size-4" aria-hidden="true" />}
                  label="Primeiro acesso"
                  value={
                    account?.firstLoginAt
                      ? formatDate(account.firstLoginAt)
                      : "Sem registro"
                  }
                />
                <AccountDetail
                  icon={<RefreshCw className="size-4" aria-hidden="true" />}
                  label="Cadastro atualizado em"
                  value={
                    account?.lastActivityAt
                      ? formatDate(account.lastActivityAt)
                      : "Sem registro"
                  }
                />
                <AccountDetail
                  icon={<MailCheck className="size-4" aria-hidden="true" />}
                  label="Verificação de email"
                  value={
                    account?.emailVerified ? "Verificado" : "Não verificado"
                  }
                />
              </dl>
            )}
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
}

function AccountDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-muted/40 px-3 py-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  );
}
