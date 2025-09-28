import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { canAccessSuperAdmin, ROLE_ERRORS } from "@/lib/rbac";
import {
  createFileRoute,
  Outlet,
  redirect,
} from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin")({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();

    if (!session) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }

    if (!canAccessSuperAdmin(session.user)) {
      throw redirect({
        to: "/",
        search: {
          error: "insufficient_permissions",
          message: ROLE_ERRORS.ADMIN_REQUIRED,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <AppBreadcrumb />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0 w-full">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-slate-600">Painel Administrativo</span>
          </div>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
