import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import {
	Award,
	CheckCircle,
	Clock,
	MoreHorizontal,
	ThumbsDown,
	ThumbsUp,
	XCircle,
} from "lucide-react";

interface CertificateRowProps {
	certificate: {
		id: number;
		status: "pending" | "approved" | "rejected" | "revoked";
		averageScore: number;
		totalTrailsCompleted: number;
		allTrailsCompletedAt: Date | string;
		reviewNotes?: string | null;
		createdAt: Date | string;
		user: {
			id: string;
			name: string;
			email: string;
		};
	};
	onApprove?: (certificate: any) => void;
	onReject?: (certificate: any) => void;
	onView?: (certificate: any) => void;
}

export function CertificateRow({ certificate, onApprove, onReject, onView }: CertificateRowProps) {
	const initials = certificate.user.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const getStatusBadge = () => {
		switch (certificate.status) {
			case "pending":
				return (
					<Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
						<Clock className="h-3 w-3" />
						Pendente
					</Badge>
				);
			case "approved":
				return (
					<Badge variant="outline" className="gap-1 text-green-600 border-green-600">
						<CheckCircle className="h-3 w-3" />
						Aprovado
					</Badge>
				);
			case "rejected":
				return (
					<Badge variant="destructive" className="gap-1">
						<XCircle className="h-3 w-3" />
						Rejeitado
					</Badge>
				);
			case "revoked":
				return (
					<Badge variant="destructive" className="gap-1">
						<XCircle className="h-3 w-3" />
						Revogado
					</Badge>
				);
		}
	};

	return (
		<TableRow
			className="group hover:bg-muted/50 transition-colors cursor-pointer"
			onClick={() => onView?.(certificate)}
		>
			<TableCell>
				<div className="flex items-center gap-3">
					<Avatar className="h-8 w-8">
						<AvatarImage
							src={certificate.user.image ?? undefined}
							alt={certificate.user.name}
						/>
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col">
						<span className="font-medium text-foreground">{certificate.user.name}</span>
						<span className="text-xs text-muted-foreground">{certificate.user.email}</span>
					</div>
				</div>
			</TableCell>

			<TableCell>
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className="font-mono">
						{certificate.averageScore.toFixed(1)}%
					</Badge>
				</div>
			</TableCell>

			<TableCell>
				<div className="flex items-center gap-1 text-sm text-muted-foreground">
					<Award className="h-4 w-4" />
					{certificate.totalTrailsCompleted}
				</div>
			</TableCell>

			<TableCell>{getStatusBadge()}</TableCell>

			<TableCell>
				<span className="text-sm text-muted-foreground">
					{formatDate(certificate.allTrailsCompletedAt)}
				</span>
			</TableCell>

			<TableCell onClick={(e) => e.stopPropagation()}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							onClick={(event) => event.stopPropagation()}
						>
							<MoreHorizontal className="h-4 w-4" />
							<span className="sr-only">Abrir ações</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem onClick={() => onView?.(certificate)}>
							<Award className="mr-2 h-4 w-4" />
							Ver detalhes
						</DropdownMenuItem>
						{certificate.status === "pending" && (
							<>
								<DropdownMenuItem onClick={() => onApprove?.(certificate)}>
									<ThumbsUp className="mr-2 h-4 w-4" />
									Aprovar
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => onReject?.(certificate)}>
									<ThumbsDown className="mr-2 h-4 w-4" />
									Rejeitar
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</TableCell>
		</TableRow>
	);
}
