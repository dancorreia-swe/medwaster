import * as React from "react";
import { Bell, ChevronsUpDown, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AuthenticatedUser } from "@/types/user";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function NavUser({ user }: { user: AuthenticatedUser }) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const initials = React.useMemo(() => {
    const name = user.name?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      return (
        parts
          .slice(0, 2)
          .map((part) => part.charAt(0)?.toUpperCase())
          .join("")
          .trim() || "?"
      );
    }
    const emailFirst = user.email?.charAt(0)?.toUpperCase();
    return emailFirst ?? "?";
  }, [user.email, user.name]);

  const handleSignOut = () => {
    authClient.signOut().then(() => {
      toast.success("Deslogado com sucesso");

      navigate({ to: "/login" });
    });
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.image ?? ""} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image ?? ""} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User />
                Minha conta
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notificações
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings />
                Configurações
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleSignOut()}
              variant="destructive"
            >
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
