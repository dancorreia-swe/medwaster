import { createFileRoute } from "@tanstack/react-router";
import {
  CertificatesPage,
  pendingCertificatesQueryOptions,
  certificateStatsQueryOptions,
} from "@/features/certificates";

export const Route = createFileRoute("/_auth/certificates/")({
  beforeLoad: () => ({ getTitle: () => "Certificados" }),
  loader: async ({ context }) => {
    const queryClient = context.queryClient;
    await Promise.all([
      queryClient.ensureQueryData(pendingCertificatesQueryOptions()),
      queryClient.ensureQueryData(certificateStatsQueryOptions()),
    ]);
    return null;
  },
  component: CertificatesPage,
});
