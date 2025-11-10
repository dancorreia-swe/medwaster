import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserX, ShieldCheck, MailWarning } from "lucide-react";

export interface UserStats {
  total: number;
  banned: number;
  verified: number;
  unverified: number;
}

interface UsersStatsProps {
  stats?: UserStats;
  isLoading?: boolean;
}

const cards = [
  {
    key: "total" as const,
    title: "Usuários",
    icon: Users,
  },
  {
    key: "verified" as const,
    title: "Verificados",
    icon: ShieldCheck,
  },
  {
    key: "unverified" as const,
    title: "Pendentes",
    icon: MailWarning,
  },
  {
    key: "banned" as const,
    title: "Banidos",
    icon: UserX,
  },
] as const;

export function UsersStats({ stats, isLoading }: UsersStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, title, icon: Icon }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {stats ? stats[key].toLocaleString("pt-BR") : "—"}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
