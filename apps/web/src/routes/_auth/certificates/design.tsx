import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  CertificateDesignPage,
  certificateDesignQueryOptions,
} from "@/features/certificates";
import { authClient } from "@/lib/auth-client";
import { buildPageHead } from "@/lib/page-title";
import { canAccessSuperAdmin } from "@/lib/rbac";

const PAGE_TITLE = "Design do certificado";

export const Route = createFileRoute("/_auth/certificates/design")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    // Super-admin only, like the /admin/config API it edits.
    if (!canAccessSuperAdmin(session?.user)) {
      throw redirect({ to: "/certificates" });
    }

    return { getTitle: () => PAGE_TITLE };
  },
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(certificateDesignQueryOptions()),
  component: CertificateDesignPage,
});
