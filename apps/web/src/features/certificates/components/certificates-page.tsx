import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Loader from "@/components/loader";
import { toast } from "sonner";
import { CertificatesTable } from "./certificates-table";
import { CertificatesStats } from "./certificates-stats";
import { CertificateReviewModal } from "./certificate-review-modal";
import { Switch } from "@/components/ui/switch";
import { usePermissions } from "@/components/auth/role-guard";
import {
  pendingCertificatesQueryOptions,
  certificateStatsQueryOptions,
  certificatesApi,
  certificatesQueryKeys,
  certificateSettingsQueryOptions,
} from "../api";
import type { CertificateTableItem } from "./certificates-table";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { CheckCheck } from "lucide-react";

export function CertificatesPage() {
  const queryClient = useQueryClient();
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateTableItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { canAccessSuperAdmin } = usePermissions();

  const certificatesQuery = useQuery(pendingCertificatesQueryOptions());
  const statsQuery = useQuery(certificateStatsQueryOptions());
  const settingsQuery = useQuery({
    ...certificateSettingsQueryOptions(),
    enabled: canAccessSuperAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      return certificatesApi.approveCertificate(id, notes);
    },
    onSuccess: () => {
      toast.success("Certificado aprovado com sucesso!");
      queryClient.invalidateQueries({
        queryKey: certificatesQueryKeys.pending(),
      });
      queryClient.invalidateQueries({
        queryKey: certificatesQueryKeys.stats(),
      });
      setIsReviewModalOpen(false);
      setSelectedCertificate(null);
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Erro ao aprovar certificado";
      toast.error(message);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (autoApproveCertificates: boolean) => {
      return certificatesApi.updateSettings({ autoApproveCertificates });
    },
    onSuccess: (data) => {
      toast.success(
        data.autoApproveCertificates
          ? "Aprovação automática ativada"
          : "Aprovação automática desativada",
      );
      queryClient.invalidateQueries({
        queryKey: certificatesQueryKeys.settings(),
      });
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Erro ao atualizar configurações";
      toast.error(message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      return certificatesApi.rejectCertificate(id, reason);
    },
    onSuccess: () => {
      toast.success("Certificado rejeitado");
      queryClient.invalidateQueries({
        queryKey: certificatesQueryKeys.pending(),
      });
      queryClient.invalidateQueries({
        queryKey: certificatesQueryKeys.stats(),
      });
      setIsReviewModalOpen(false);
      setSelectedCertificate(null);
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Erro ao rejeitar certificado";
      toast.error(message);
    },
  });

  const handleApprove = (certificate: CertificateTableItem) => {
    setSelectedCertificate(certificate);
    setIsReviewModalOpen(true);
  };

  const handleReject = (certificate: CertificateTableItem) => {
    setSelectedCertificate(certificate);
    setIsReviewModalOpen(true);
  };

  const handleView = (certificate: CertificateTableItem) => {
    setSelectedCertificate(certificate);
    setIsReviewModalOpen(true);
  };

  const handleConfirmApprove = (id: number, notes?: string) => {
    approveMutation.mutate({ id, notes });
  };

  const handleConfirmReject = (id: number, reason: string) => {
    rejectMutation.mutate({ id, reason });
  };

  const data = certificatesQuery.data;
  const certificates = data?.certificates ?? [];
  const stats = statsQuery.data ?? undefined;

  const errorMessage =
    certificatesQuery.error instanceof Error
      ? certificatesQuery.error.message
      : "Não foi possível carregar os certificados.";

  const tableData = certificates.map((cert) => ({
    ...cert,
    allTrailsCompletedAt: cert.allTrailsCompletedAt,
    createdAt: cert.createdAt,
    updatedAt: cert.updatedAt,
  }));

  const isPending = approveMutation.isPending || rejectMutation.isPending;
  const autoApproveEnabled = useMemo(
    () => settingsQuery.data?.autoApproveCertificates ?? false,
    [settingsQuery.data?.autoApproveCertificates],
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold md:text-3xl">Certificados</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Gerencie e aprove os certificados gerados automaticamente quando os
            alunos completam todas as trilhas.
          </p>
        </div>
      </header>

      {canAccessSuperAdmin && (
        <>
          <Item variant="outline">
            <ItemMedia variant="icon">
              <CheckCheck />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Aprovação automática</ItemTitle>
              <ItemDescription>
                Quando ativado, novos certificados são aprovados imediatamente
                após todas as trilhas serem concluídas.
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch
                checked={autoApproveEnabled}
                onCheckedChange={(checked) =>
                  updateSettingsMutation.mutate(checked)
                }
                disabled={
                  settingsQuery.isLoading || updateSettingsMutation.isPending
                }
                aria-label="Ativar aprovação automática"
              />
            </ItemActions>
          </Item>
        </>
      )}

      <CertificatesStats stats={stats} isLoading={statsQuery.isLoading} />

      {certificatesQuery.isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar certificados</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {certificatesQuery.isLoading ? (
        <div className="min-h-[300px] rounded-md border border-border bg-card">
          <Loader />
        </div>
      ) : (
        <CertificatesTable
          data={tableData}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={handleView}
        />
      )}

      <CertificateReviewModal
        certificate={selectedCertificate}
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        onApprove={handleConfirmApprove}
        onReject={handleConfirmReject}
        isPending={isPending}
      />
    </div>
  );
}
