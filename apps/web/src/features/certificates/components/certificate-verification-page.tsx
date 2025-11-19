import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { Award, CheckCircle2, XCircle, Home } from "lucide-react";
import type { CertificateVerificationResult } from "../api/certificatesApi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { authClient } from "@/lib/auth-client";

function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function CertificateVerificationPage({
  code,
  result,
}: {
  code: string;
  result: CertificateVerificationResult;
}) {
  const { data: session } = authClient.useSession();

  const header = result.isValid
    ? {
        title: "Certificado válido",
        description: "Encontramos um certificado ativo para este código.",
        icon: <CheckCircle2 className="h-10 w-10 text-green-600" />,
        badgeClass: "bg-green-50 text-green-800 border-green-200",
      }
    : {
        title: "Certificado não encontrado",
        description:
          result.message ||
          "Não encontramos nenhum certificado aprovado com este código. Verifique se digitou corretamente.",
        icon: <XCircle className="h-10 w-10 text-red-600" />,
        badgeClass: "bg-red-50 text-red-800 border-red-200",
      };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 lg:py-16">
        <div className="space-y-2 text-center">
          <Badge
            variant="outline"
            className={`mx-auto uppercase tracking-wide ${header.badgeClass}`}
          >
            Verificação de certificado
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground">
            {header.title}
          </h1>
          <p className="text-muted-foreground">{header.description}</p>
        </div>

        <Card className="border-border">
          <CardContent className="space-y-6 pt-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-left">
                <div className="rounded-full bg-muted p-3">{header.icon}</div>
                <div>
                  <p className="text-sm text-muted-foreground">Código verificado</p>
                  <p className="font-mono text-xl font-semibold text-foreground">
                    {code.toUpperCase()}
                  </p>
                </div>
              </div>
              {session && (
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/">
                    <Home className="h-4 w-4" /> Voltar para o início
                  </Link>
                </Button>
              )}
            </div>

            <Separator />

            {result.isValid ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Emitido para</p>
                  <h2 className="text-2xl font-bold text-foreground">
                    {result.userName}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <InfoTile label="Média geral" value={`${result.averageScore.toFixed(1)}%`} />
                  <InfoTile label="Trilhas concluídas" value={result.totalTrailsCompleted} />
                  <InfoTile label="Emitido em" value={formatDate(result.issuedAt)} />
                </div>

                <div className="rounded-2xl border border-dashed border-muted p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-amber-500" />
                    <p>
                      Este certificado foi emitido pela plataforma MedWaster e pode ser consultado a qualquer
                      momento neste endereço.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Certificados válidos possuem um código no formato <strong>CERT-AAAA-XXXXXX</strong>. Caso o código
                  esteja correto, peça para o aluno reenviar o link oficial ou gere um novo certificado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
