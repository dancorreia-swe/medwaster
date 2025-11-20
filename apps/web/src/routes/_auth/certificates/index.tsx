import { createFileRoute } from "@tanstack/react-router";
import {
  CertificatesPage,
  pendingCertificatesQueryOptions,
  certificateStatsQueryOptions,
} from "@/features/certificates";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Certificados";

export const Route = createFileRoute("/_auth/certificates/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
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
