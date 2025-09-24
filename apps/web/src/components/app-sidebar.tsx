import { FileQuestion, Home, Inbox, type LucideIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { TRoute } from "@/types/routes";
import { Link, useLocation } from "@tanstack/react-router";

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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.to}>
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
    </Sidebar>
  );
}
