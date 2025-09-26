import { AppSidebar } from "@/components/layout/sidebar/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import type { AuthenticatedUser } from "@/types/user";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
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

    return { session };
  },
  loader: ({ context: { session } }) => {
    return {
      session,
      user: session.user as AuthenticatedUser,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main>
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
