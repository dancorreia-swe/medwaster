import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Award, Calendar, CheckCircle, Clock, Mail, Timer } from "lucide-react";

interface CertificateReviewModalProps {
  certificate: {
    id: number;
    status: string;
    averageScore: number;
    totalTrailsCompleted: number;
    totalTimeMinutes: number;
    allTrailsCompletedAt: Date | string;
    verificationCode: string;
    createdAt: Date | string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: number, notes?: string) => void;
  onReject: (id: number, reason: string) => void;
  isPending?: boolean;
}

export function CertificateReviewModal({
  certificate,
  open,
  onOpenChange,
  onApprove,
  onReject,
  isPending,
}: CertificateReviewModalProps) {
  const [notes, setNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  if (!certificate) return null;

  const initials = certificate.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleConfirm = () => {
    if (action === "approve") {
      onApprove(certificate.id, notes || undefined);
    } else if (action === "reject") {
      if (!notes.trim()) return;
      onReject(certificate.id, notes);
    }
    setNotes("");
    setAction(null);
  };

  const handleCancel = () => {
    setNotes("");
    setAction(null);
    onOpenChange(false);
  };

  const hoursSpent = Math.floor(certificate.totalTimeMinutes / 60);
  const minutesSpent = certificate.totalTimeMinutes % 60;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar Certificado</DialogTitle>
          <DialogDescription>
            Analise os dados do aluno e aprove ou rejeite o certificado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pr-1 transition-all duration-300 ease-in-out">
          {/* User Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border bg-muted/50">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={certificate.user.image ?? undefined}
                alt={certificate.user.name}
              />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">
                {certificate.user.name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{certificate.user.email}</span>
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              ID: {certificate.user.id.slice(0, 8)}
            </Badge>
          </div>

          {/* Certificate Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>Média Final</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {certificate.averageScore.toFixed(1)}%
              </p>
            </div>

            <div className="p-4 rounded-lg border space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Award className="h-4 w-4 flex-shrink-0" />
                <span>Trilhas Concluídas</span>
              </div>
              <p className="text-2xl font-bold">
                {certificate.totalTrailsCompleted}
              </p>
            </div>

            <div className="p-4 rounded-lg border space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Timer className="h-4 w-4 flex-shrink-0" />
                <span>Tempo Total</span>
              </div>
              <p className="text-2xl font-bold">
                {hoursSpent}h {minutesSpent}m
              </p>
            </div>

            <div className="p-4 rounded-lg border space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>Data de Conclusão</span>
              </div>
              <p className="text-sm font-medium break-words">
                {formatDate(certificate.allTrailsCompletedAt)}
              </p>
            </div>
          </div>

          {/* Verification Code */}
          <div className="p-4 rounded-lg border bg-muted/30">
            <Label className="text-sm font-medium">Código de Verificação</Label>
            <p className="font-mono text-lg font-bold mt-1 break-all">
              {certificate.verificationCode}
            </p>
          </div>

          {/* Notes/Reason Input */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: action ? "500px" : "0px",
              opacity: action ? 1 : 0,
            }}
          >
            <div className="space-y-2 p-px p-px">
              <Label htmlFor="notes">
                {action === "approve"
                  ? "Observações (opcional)"
                  : "Motivo da Rejeição*"}
              </Label>
              <Textarea
                id="notes"
                placeholder={
                  action === "approve"
                    ? "Adicione observações sobre a aprovação..."
                    : "Explique o motivo da rejeição..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              {action === "reject" && !notes.trim() && (
                <p className="text-xs text-destructive">
                  O motivo da rejeição é obrigatório
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {!action ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Fechar
              </Button>
              {certificate.status === "pending" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setAction("reject")}
                    disabled={isPending}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => setAction("approve")}
                    disabled={isPending}
                  >
                    Aprovar
                  </Button>
                </>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setAction(null);
                  setNotes("");
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                variant={action === "approve" ? "default" : "destructive"}
                onClick={handleConfirm}
                disabled={isPending || (action === "reject" && !notes.trim())}
              >
                {isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : action === "approve" ? (
                  "Confirmar Aprovação"
                ) : (
                  "Confirmar Rejeição"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
