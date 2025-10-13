import { AppBreadcrumb } from "@/components/layout/app-breadcrumb";
import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { canAccessWebApp, ROLE_ERRORS } from "@/lib/rbac";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ThemeSwitcher } from "@/components/ui/shadcn-io/theme-switcher";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();

    if (!session) {
      const redirectSearch =
        location.href === "/"
          ? undefined
          : {
              redirect: location.href,
            };

      throw redirect({
        to: "/login",
        ...(redirectSearch ? { search: redirectSearch } : {}),
      });
    }

    if (!canAccessWebApp(session.user)) {
      throw redirect({
        to: "/access-denied",
        search: {
          error: "web_access_denied",
          message:
            session.user.role === "user"
              ? ROLE_ERRORS.USER_ROLE_WEB_BLOCKED
              : ROLE_ERRORS.WEB_ACCESS_DENIED,
          userRole: session.user.role,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="px-6">
        <header className="flex h-16 shrink-0 items-center gap-2 justify-between pr-4 mb-4">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <AppBreadcrumb />
          </div>

          <ThemeSwitcher
            value={theme as "light" | "dark" | "system"}
            onChange={setTheme as (t: "light" | "dark" | "system") => void}
          />
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 pt-0 w-full">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
