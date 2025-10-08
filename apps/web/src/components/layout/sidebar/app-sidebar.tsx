import {
  Command,
  Home,
  Shield,
  Settings,
  Users,
  BookOpen,
  Tag,
  type LucideIcon,
  Shapes,
  Route,
  ChevronRight,
  BookType,
  Trophy,
  HelpCircle,
  ClipboardList,
  BrainCircuit,
  BadgeCheck,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { SuperAdminOnly, usePermissions } from "@/components/auth/role-guard";
import type { TRoute } from "@/types/routes";
import { Link, useLocation } from "@tanstack/react-router";
import { NavUser } from "./nav-user";
import type { AuthenticatedUser } from "@/types/user";
import { authClient } from "@/lib/auth-client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@radix-ui/react-collapsible";

interface BaseSidebarItem {
  title: string;
  icon: LucideIcon;
  requiresSuperAdmin?: boolean;
}

interface SidebarSingleItem extends BaseSidebarItem {
  to: TRoute;
  isActive?: boolean;
}

interface SidebarCollapsibleItem extends BaseSidebarItem {
  isActive?: boolean;
  items: SidebarSingleItem[];
}

type SidebarItem = SidebarSingleItem | SidebarCollapsibleItem;

function isSingleItem(item: SidebarItem): item is SidebarSingleItem {
  return "to" in item;
}

function isCollapsibleItem(item: SidebarItem): item is SidebarCollapsibleItem {
  return "items" in item;
}

const adminItems = [
  {
    title: "Painel Principal",
    to: "/",
    icon: Home,
  },
  {
    title: "Wiki",
    isActive: true,
    icon: BookOpen,
    items: [
      {
        title: "Artigos",
        to: "/wiki",
        icon: BookType,
      },
      {
        title: "Categorias",
        to: "/categories",
        icon: Shapes,
      },
    ],
  },
  {
    title: "Questões e Quizzes",
    icon: HelpCircle,
    items: [
      {
        title: "Questões Isoladas",
        to: "/questions",
        icon: ClipboardList,
      },
      {
        title: "Quizzes",
        to: "/questions",
        icon: BrainCircuit,
      },
    ],
  },
  {
    title: "Trilhas",
    to: "/trails",
    icon: Route,
  },
  {
    title: "Tags",
    to: "/tags",
    icon: Tag,
  },
  {
    title: "Conquistas",
    to: "/achievements",
    icon: Trophy,
  },
  {
    title: "Certificados",
    to: "/certificates",
    icon: BadgeCheck
  }
] as const satisfies readonly SidebarItem[];

const superAdminItems = [
  {
    title: "Configurações do Sistema",
    to: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Gerenciar Usuários",
    to: "/admin/users",
    icon: Users,
    requiresSuperAdmin: true,
  },
] as const satisfies readonly SidebarSingleItem[];

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
                if (
                  "requiresSuperAdmin" in item &&
                  item.requiresSuperAdmin &&
                  !canAccessSuperAdmin
                ) {
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

                if (isCollapsibleItem(item)) {
                  return (
                    <Collapsible
                      key={item.title}
                      asChild
                      defaultOpen={item.isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.title}>
                            <item.icon />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  isActive={location.pathname === subItem.to}
                                  asChild
                                >
                                  <Link to={subItem.to}>
                                    <subItem.icon />
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                if (isSingleItem(item)) {
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
                }

                return null;
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
