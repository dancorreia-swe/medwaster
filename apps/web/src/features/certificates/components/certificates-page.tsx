import { useEffect, useState } from "react";
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
import type { CertificateSettings } from "../api";
import type { CertificateTableItem } from "./certificates-table";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { CheckCheck, ChevronsUpDown, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function CertificatesPage() {
  const queryClient = useQueryClient();
  const [selectedCertificate, setSelectedCertificate] =
    useState<CertificateTableItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const { canAccessSuperAdmin } = usePermissions();

  const certificatesQuery = useQuery(pendingCertificatesQueryOptions());
  const statsQuery = useQuery(certificateStatsQueryOptions());
  const settingsQuery = useQuery({
    ...certificateSettingsQueryOptions(),
    enabled: canAccessSuperAdmin,
  });

  const [settingsForm, setSettingsForm] = useState<CertificateSettings | null>(
    null,
  );

  useEffect(() => {
    if (settingsQuery.data) {
      setSettingsForm(settingsQuery.data);
    }
  }, [settingsQuery.data]);

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
    mutationFn: async (payload: Partial<CertificateSettings>) => {
      return certificatesApi.updateSettings(payload);
    },
    onSuccess: (data, variables) => {
      setSettingsForm(data);
      const autoApproveChanged =
        typeof variables?.autoApproveCertificates === "boolean";
      const message = autoApproveChanged
        ? data.autoApproveCertificates
          ? "Aprovação automática ativada"
          : "Aprovação automática desativada"
        : "Configurações do certificado atualizadas";
      toast.success(message);
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

  const handleSettingsUpdate = (payload: Partial<CertificateSettings>) => {
    if (!settingsForm) return;
    setSettingsForm({
      ...settingsForm,
      ...payload,
    });
    updateSettingsMutation.mutate(payload);
  };

  const data = certificatesQuery.data;
  const certificates = data?.certificates ?? [];
  const stats = statsQuery.data ?? undefined;
  const autoApproveEnabled =
    settingsForm?.autoApproveCertificates ??
    settingsQuery.data?.autoApproveCertificates ??
    false;
  const certificateTitle =
    settingsForm?.certificateTitle ??
    settingsQuery.data?.certificateTitle ??
    "";
  const unlockRequirement =
    settingsForm?.certificateUnlockRequirement ??
    settingsQuery.data?.certificateUnlockRequirement ??
    "trails";
  const minStudyHours =
    settingsForm?.certificateMinStudyHours ??
    settingsQuery.data?.certificateMinStudyHours ??
    0;
  const maxStudyHours =
    settingsForm?.certificateMaxStudyHours ??
    settingsQuery.data?.certificateMaxStudyHours ??
    0;
  const settingsLoading =
    settingsQuery.isLoading || (!settingsForm && !settingsQuery.data);

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
  const progressLabel =
    unlockRequirement === "articles"
      ? "Artigos"
      : unlockRequirement === "trails_and_articles"
        ? "Trilhas e Artigos"
        : "Trilhas";

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
          <Collapsible
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            className="space-y-3"
          >
            <Item variant="outline">
              <ItemMedia variant="icon">
                <CheckCheck />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Configurações do certificado</ItemTitle>
                <ItemDescription>
                  Ajuste aprovação, título, critério e limites de estudo.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {settingsOpen ? "Esconder" : "Mostrar"}{" "}
                    <ChevronsUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </ItemActions>
            </Item>

            <CollapsibleContent className="space-y-3">
              <Item variant="outline">
                <ItemMedia variant="icon">
                  <BadgeCheck />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Aprovação automática</ItemTitle>
                  <ItemDescription>
                    Quando ativado, novos certificados são aprovados
                    imediatamente após todas as trilhas serem concluídas.
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Switch
                    checked={autoApproveEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({
                        autoApproveCertificates: checked,
                      })
                    }
                    disabled={
                      settingsLoading || updateSettingsMutation.isPending
                    }
                    aria-label="Ativar aprovação automática"
                  />
                </ItemActions>
              </Item>

              <Item variant="outline">
                <ItemContent className="gap-3">
                  <ItemTitle>Nome e critério</ItemTitle>
                  <ItemDescription>
                    Ajuste o título exibido no PDF e escolha o gatilho de
                    liberação do certificado.
                  </ItemDescription>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Input
                        value={certificateTitle}
                        onChange={(event) =>
                          setSettingsForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  certificateTitle: event.target.value,
                                }
                              : prev,
                          )
                        }
                        placeholder="Ex: Certificado de Conclusão"
                        disabled={
                          settingsLoading || updateSettingsMutation.isPending
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Select
                        value={unlockRequirement}
                        onValueChange={(value) =>
                          handleSettingsUpdate({
                            certificateUnlockRequirement:
                              value as CertificateSettings["certificateUnlockRequirement"],
                          })
                        }
                        disabled={
                          settingsLoading || updateSettingsMutation.isPending
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o critério" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trails">
                            Concluir todas as trilhas
                          </SelectItem>
                          <SelectItem value="articles">
                            Ler todos os artigos publicados
                          </SelectItem>
                          <SelectItem value="trails_and_articles">
                            Concluir trilhas e artigos publicados
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        handleSettingsUpdate({
                          certificateTitle: certificateTitle,
                          certificateUnlockRequirement: unlockRequirement,
                        })
                      }
                      disabled={
                        settingsLoading ||
                        updateSettingsMutation.isPending ||
                        !certificateTitle.trim()
                      }
                    >
                      Salvar título e critério
                    </Button>
                  </div>
                </ItemContent>
              </Item>

              <Item variant="outline">
                <ItemContent className="gap-3">
                  <ItemTitle>Limites de horas de estudo</ItemTitle>
                  <ItemDescription>
                    Defina mínimos e máximos para emissão. Use 0 para desabilitar.
                  </ItemDescription>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min={0}
                        value={minStudyHours.toString()}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setSettingsForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  certificateMinStudyHours: Number.isNaN(value)
                                    ? 0
                                    : Math.max(0, value),
                                }
                              : prev,
                          );
                        }}
                        disabled={
                          settingsLoading || updateSettingsMutation.isPending
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="number"
                        min={0}
                        value={maxStudyHours.toString()}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setSettingsForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  certificateMaxStudyHours: Number.isNaN(value)
                                    ? 0
                                    : Math.max(0, value),
                                }
                              : prev,
                          );
                        }}
                        disabled={
                          settingsLoading || updateSettingsMutation.isPending
                        }
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        handleSettingsUpdate({
                          certificateMinStudyHours: minStudyHours,
                          certificateMaxStudyHours: maxStudyHours,
                        })
                      }
                      disabled={
                        settingsLoading || updateSettingsMutation.isPending
                      }
                    >
                      Salvar limites
                    </Button>
                  </div>
                </ItemContent>
              </Item>
            </CollapsibleContent>
          </Collapsible>
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
          progressLabel={progressLabel}
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
