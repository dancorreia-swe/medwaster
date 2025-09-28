import { AuditLogList } from "@/features/admin/audit-logs";
import { authClient } from "@/lib/auth-client";
import { canViewAuditLogs } from "@/lib/rbac";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const Route = createFileRoute("/_auth/admin/audit-logs")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    // Authentication check is already handled by parent route
    // Here we only need to check specific audit log permissions
    if (!canViewAuditLogs(session?.user)) {
      throw redirect({
        to: "/",
        search: {
          error: "insufficient_permissions",
          message: "Acesso aos logs de auditoria restrito a administradores.",
        },
      });
    }
  },
});

function RouteComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto py-6">
        <AuditLogList 
          baseURL={import.meta.env.VITE_SERVER_URL || "http://localhost:3000"} 
        />
      </div>
    </QueryClientProvider>
  );
}