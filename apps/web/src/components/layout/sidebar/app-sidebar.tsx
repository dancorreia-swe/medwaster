import {
  Command,
  Home,
  Shield,
  Settings,
  Users,
  BarChart3,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SuperAdminOnly, usePermissions } from "@/components/auth/role-guard";
import type { TRoute } from "@/types/routes";
import { Link, useLocation } from "@tanstack/react-router";
import { NavUser } from "./nav-user";
import type { AuthenticatedUser } from "@/types/user";
import { authClient } from "@/lib/auth-client";

type SidebarItem = {
  title: string;
  to: TRoute;
  icon: LucideIcon;
  requiresSuperAdmin?: boolean;
};

const adminItems: SidebarItem[] = [
  {
    title: "Painel Principal",
    to: "/",
    icon: Home,
  },
  {
    title: "Wiki",
    to: "/wiki",
    icon: BookOpen,
  },
];

const superAdminItems: SidebarItem[] = [
  {
    title: "Configurações do Sistema",
    to: "/admin/system-settings",
    icon: Settings,
  },
  {
    title: "Logs de Auditoria",
    to: "/admin/audit-logs",
    icon: Shield,
  },
  {
    title: "Gerenciar Usuários",
    to: "/admin/users",
    icon: Users,
    requiresSuperAdmin: true,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { data } = authClient.useSession();
  const { canAccessSuperAdmin } = usePermissions();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">MedWaster</span>
                  <span className="truncate text-xs">
                    Painel Administrativo
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Admin Section - All web users are admins */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                // Hide super-admin-only items for regular admins
                if (item.requiresSuperAdmin && !canAccessSuperAdmin) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton disabled className="opacity-50">
                        <item.icon />
                        <span>{item.title}</span>
                        <span className="text-xs text-red-500 ml-auto">
                          Super Admin
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Super Admin Section - Only visible to super-admin */}
        <SuperAdminOnly hideOnNoAccess>
          <SidebarGroup>
            <SidebarGroupLabel>Super Administrador</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === item.to}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SuperAdminOnly>
      </SidebarContent>
      <SidebarFooter>
        {data?.user && <NavUser user={data.user as AuthenticatedUser} />}
      </SidebarFooter>
    </Sidebar>
  );
}
