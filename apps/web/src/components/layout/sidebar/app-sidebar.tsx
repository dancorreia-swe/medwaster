import {
  Home,
  Settings,
  Users,
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
  Shield,
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
} from "@/components/ui/collapsible";

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
    title: "Artigos",
    to: "/wiki",
    icon: BookType,
  },
  {
    title: "Categorias",
    to: "/categories",
    icon: Shapes,
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
        to: "/quizzes",
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
    title: "Usuários do App",
    to: "/admin/users",
    icon: Users,
  },
  {
    title: "Certificados",
    to: "/certificates",
    icon: BadgeCheck,
  },
] as const satisfies readonly SidebarItem[];

const superAdminItems = [
  {
    title: "Equipe Administrativa",
    to: "/admin/team",
    icon: Shield,
  },
] as const satisfies readonly SidebarSingleItem[];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { data } = authClient.useSession();
  const { canAccessSuperAdmin } = usePermissions();

  const normalizeTarget = (target: string) =>
    target === "/" ? "/" : target.replace(/\/$/, "");

  const isPathActive = (target: string) => {
    const normalizedTarget = normalizeTarget(target);
    if (normalizedTarget === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === normalizedTarget ||
      location.pathname.startsWith(`${normalizedTarget}/`)
    );
  };

  const isCollapsibleOpen = (item: SidebarCollapsibleItem) => {
    if (item.isActive !== undefined) return item.isActive;

    return item.items.some(
      (subItem) =>
        location.pathname === subItem.to ||
        location.pathname.startsWith(`${subItem.to}/`),
    );
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <img
                    src="/outline-mascot.png"
                    alt="MedWaster"
                    className="h-5 w-5"
                  />
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
                      defaultOpen={isCollapsibleOpen(item)}
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
                        <CollapsibleContent animate>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  isActive={isPathActive(subItem.to)}
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
                        isActive={isPathActive(item.to)}
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
                    <SidebarMenuButton asChild isActive={isPathActive(item.to)}>
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
