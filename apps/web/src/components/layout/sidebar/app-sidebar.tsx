import {
  Command,
  FileQuestion,
  Home,
  Inbox,
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
import type { TRoute } from "@/types/routes";
import { Link, useLocation } from "@tanstack/react-router";
import { NavUser } from "./nav-user";
import type { AuthenticatedUser } from "@/types/user";
import { authClient } from "@/lib/auth-client";

type SidebarItem = {
  title: string;
  to: TRoute;
  icon: LucideIcon;
};

const items: SidebarItem[] = [
  {
    title: "Home",
    to: "/",
    icon: Home,
  },
  {
    title: "Inbox",
    to: "/wiki/topics",
    icon: Inbox,
  },
  {
    title: "Questões",
    to: "/questions",
    icon: FileQuestion,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { data } = authClient.useSession();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Medwaster</span>
                  <span className="truncate text-xs">Admin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Medwaster</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
      </SidebarContent>
      <SidebarFooter>
        {data?.user && <NavUser user={data.user as AuthenticatedUser} />}
      </SidebarFooter>
    </Sidebar>
  );
}
