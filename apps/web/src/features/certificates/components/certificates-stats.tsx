import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Award, CheckCircle, Clock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface CertificateStats {
	total: number;
	pending: number;
	approved: number;
	rejected: number;
	revoked: number;
	approvalRate: number;
}

interface CertificatesStatsProps {
	stats?: CertificateStats;
	isLoading?: boolean;
}

export function CertificatesStats({ stats, isLoading }: CertificatesStatsProps) {
	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded-full" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (!stats) {
		return null;
	}

	const statCards = [
		{
			title: "Total",
			value: stats.total,
			description: "Certificados gerados",
			icon: Award,
			color: "text-blue-600",
		},
		{
			title: "Pendentes",
			value: stats.pending,
			description: "Aguardando aprovação",
			icon: Clock,
			color: "text-yellow-600",
		},
		{
			title: "Aprovados",
			value: stats.approved,
			description: `Taxa: ${stats.approvalRate}%`,
			icon: CheckCircle,
			color: "text-green-600",
		},
		{
			title: "Rejeitados",
			value: stats.rejected + stats.revoked,
			description: `${stats.rejected} rejeitados, ${stats.revoked} revogados`,
			icon: XCircle,
			color: "text-red-600",
		},
	];

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			{statCards.map((stat) => {
				const Icon = stat.icon;
				return (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.title}
							</CardTitle>
							<Icon className={`h-4 w-4 ${stat.color}`} />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">
								{stat.description}
							</p>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
